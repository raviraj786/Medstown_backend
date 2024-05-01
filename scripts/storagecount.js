let S3 = require("aws-sdk/clients/s3")
let s3 = new S3({
    endpoint: "https://usc1.contabostorage.com/medstown",
    accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
    secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
    s3BucketEndpoint: true,
    publicReadAccess: true,
});

async function listAllObjectsFromS3Bucket(bucket, prefix) {
    let isTruncated = true;
    let marker;
    const elements = [];
    while(isTruncated) {
      let params = { Bucket: bucket };
      if (prefix) params.Prefix = prefix;
      if (marker) params.Marker = marker;
      try {
        const response = await s3.listObjects(params).promise();
        response.Contents.forEach(item => {
          elements.push(item.Key);
        });
        isTruncated = response.IsTruncated;
        if (isTruncated) {
          marker = response.Contents.slice(-1)[0].Key;
        }
    } catch(error) {
        throw error;
      }
    }
    console.log(elements);
    return elements;
  }
  
listAllObjectsFromS3Bucket("medstown","").then((data) => {
    console.log(data);
}
).catch((err) => {
    console.log(err);
}
);