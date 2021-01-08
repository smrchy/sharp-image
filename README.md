# Sharp-Image

Resize images by adding for example `=s320` at the end of the URL.

## But WHY?

Adding the resize parameter at the end of the URL contrary to query parameters allows for far better caching via CDNs.

Trivia: This way of resizing images was pioneered by Google with the first version of their public Picasa Albums.

## Supported Sizes and Crop-Sizes

Can be set via `config.json`.

Runs as a docker container on port 3000.

## Resize an image

http://some.domain/image.jpg

Resize to 320px width: 

http://url.to.sharp-image.xy/image/some.domain/image.jpg=s320

## Crop an image

http://some.domain/image.jpg

Crop to 64x64px: 

http://url.to.sharp-image.xy/image/some.domain/image.jpg=s64-c
