package main

import (
	"context"
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	bucketName := os.Getenv("R2_BUCKET_NAME")

	if accountID == "" || accessKey == "" || secretKey == "" || bucketName == "" {
		log.Fatal("Please set R2_ACCOUNT_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.")
	}

	r2Endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               r2Endpoint,
			HostnameImmutable: true,
			SigningRegion:     "auto",
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		log.Fatalf("Failed to load configuration, %v", err)
	}

	client := s3.NewFromConfig(cfg)

	localDir := "../tmp"
	log.Printf("Starting sync from local directory: %s to bucket: %s\n", localDir, bucketName)

	err = filepath.Walk(localDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			log.Printf("Failed to open file %s: %v\n", path, err)
			return nil
		}
		defer file.Close()

		// Construct object key. We strip the '../' so it still looks like 'tmp/image.png' in R2.
		// e.g. path is "../tmp/image.png", key will be "tmp/image.png".
		cleanPath := strings.TrimPrefix(filepath.ToSlash(path), "../")
		key := cleanPath

		contentType := mime.TypeByExtension(filepath.Ext(path))
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
			Bucket:      aws.String(bucketName),
			Key:         aws.String(key),
			Body:        file,
			ContentType: aws.String(contentType),
		})
		if err != nil {
			log.Printf("Failed to upload %s: %v\n", path, err)
			return nil
		}

		fmt.Printf("✅ Uploaded %s to R2 (%s/%s)\n", path, bucketName, key)
		return nil
	})

	if err != nil {
		log.Fatalf("Sync failed: %v", err)
	}

	fmt.Println("🎉 Sync complete!")
	fmt.Println("Public R2 Dev URL: https://pub-51be92105d1a4b98980a3bf71d2b148d.r2.dev/tmp/<filename>")
}
