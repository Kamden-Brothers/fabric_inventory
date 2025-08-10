import os
from os import listdir, makedirs
from os.path import isfile, join

from PIL import Image

# Base directory
base_path = os.path.dirname(os.path.abspath(__file__))

# Paths
mainImagesPath = os.path.join(base_path, '..', 'fabric_uploads')
thumbNailPath = os.path.join(base_path, '..', 'fabric_thumbnails')
makedirs(thumbNailPath, exist_ok=True)


def createAllThumbnails():
    # Collect image files
    allFiles = [f for f in listdir(mainImagesPath) if isfile(join(mainImagesPath, f))]
    imgFiles = [f for f in allFiles if f.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'))]
    for imgFile in imgFiles:
        if not os.path.exists(join(thumbNailPath, imgFile)):
            createThumbnail(imgFile)


def createThumbnail(imgFile):
    # Resize and save
    im = Image.open(join(mainImagesPath, imgFile))

    newWidth = 400
    wpercent = newWidth / float(im.size[0])
    newHeight = int(float(im.size[1]) * wpercent)

    im = im.resize((newWidth, newHeight), Image.LANCZOS)

    im.save(join(thumbNailPath, imgFile))
    print(f'Thumbnail created for {imgFile}')
