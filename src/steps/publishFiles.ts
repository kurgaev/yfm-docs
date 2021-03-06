import {readFileSync} from 'fs';
import walkSync from 'walk-sync';
import {resolve, join} from 'path';
import S3 from 'aws-sdk/clients/s3';
import mime from 'mime-types';

import {ArgvService} from '../services';
import {logger} from '../utils';

const DEFAULT_PREFIX = process.env.YFM_STORAGE_PREFIX ?? '';

/**
 * Publishes output files to S3 compatible storage
 * @return {void}
 */
export function publishFiles() {
    const {
        output: outputFolderPath,
        ignore = [],
        storageEndpoint: endpoint,
        storageBucket: bucket,
        storagePrefix: prefix = DEFAULT_PREFIX,
        storageKeyId: accessKeyId,
        storageSecretKey: secretAccessKey,
    } = ArgvService.getConfig();

    const s3Client = new S3({
        endpoint, accessKeyId, secretAccessKey,
    });

    const filesToPublish: string[] = walkSync(resolve(outputFolderPath), {
        directories: false,
        includeBasePath: false,
        ignore,
    });

    for (const pathToFile of filesToPublish) {
        const mimeType = mime.lookup(pathToFile);

        const params: S3.Types.PutObjectRequest = {
            ContentType: mimeType ? mimeType : undefined,
            Bucket: bucket,
            Key: join(prefix, pathToFile),
            Body: readFileSync(resolve(outputFolderPath, pathToFile)),
        };

        logger.upload(pathToFile);

        s3Client.upload(params, (error) => {
            if (error) {
                throw error;
            }
        });
    }
}
