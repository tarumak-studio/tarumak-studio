/* tool-guides.js — page-specific text for tool pages (build time only).
 *
 * Why: most tool pages were about 80% shared template, and Google left them
 * as "Crawled - currently not indexed". A tool listed here gets its own
 * explanation instead of the category's generic benefits and tips.
 *
 * Rule: every statement must match what the tool's INIT[] code really does.
 * Change the tool, change its guide.
 *   lead      opening paragraph
 *   howTo     [[step, detail], ...]
 *   sections  [[heading, paragraph], ...]
 *   faq       [[question, answer], ...]  replaces the FAQ from data.js
 */
'use strict';
module.exports = {
  'exif-remover': {
    lead: 'A photo can carry the place it was taken, the date, the camera and sometimes the owner’s name. This tool saves a clean copy of the picture without that hidden data. It works on JPG, PNG and WebP files, one at a time or in a batch.',
    howTo: [
      ['Add your photos', 'Drop one or several JPG, PNG or WebP files. Each one is processed as soon as you add it.'],
      ['Set the quality first if it matters', 'The slider runs from 50% to 100% and starts at 92%. Set it before adding the photos.'],
      ['Download the clean copies', 'Save them one by one, or use Download all when there are several.']
    ],
    sections: [
      ['How the data is removed', 'The picture is opened and drawn again from its pixels, then saved as a new JPG. EXIF, GPS, IPTC and XMP blocks are not part of the pixels, so they do not make it into the new file. This is more thorough than deleting single fields, because nothing is copied across at all.'],
      ['What changes in the picture', 'The result is always a JPG, whatever you put in. Because JPG is a lossy format, the image is compressed once more; at 92% the difference is hard to see. Transparent areas of a PNG or WebP turn white. A photo that was stored sideways with a rotation flag comes out the right way up.'],
      ['What it cannot hide', 'Only hidden data is removed. A street sign, a house number, a reflection or a visible watermark stays in the picture, and so does the file name if you typed a place or a person into it. Check the image itself before you post it.'],
      ['When it is worth doing', 'Photos taken at home are the usual reason: a listing on a marketplace can reveal your address through GPS coordinates. Many social networks strip this data for you, but e-mail attachments, cloud links and most forums pass it on untouched.']
    ],
    faq: [
      ['Does it remove GPS location?', 'Yes. Location, date, camera model, software, author and copyright fields are all left behind because the picture is saved again from its pixels.'],
      ['Why do I get a JPG when I added a PNG?', 'This tool always saves JPG. If you need to keep PNG or transparency, use the Universal Image Converter instead, which also drops metadata.'],
      ['Is my original changed?', 'No. You get a new file; the original stays as it was, with its metadata.'],
      ['Should I delete metadata from photos I sell?', 'Not always. Copyright and author fields can help prove ownership, so keep an original with its metadata.']
    ]
  },
  'webp-to-jpg': {
    lead: 'WebP images saved from websites often refuse to open in older photo editors, office programs and upload forms. This converter turns them into ordinary JPG files that open practically everywhere, several at a time.',
    howTo: [
      ['Choose the quality', 'The slider goes from 50% to 100% and starts at 92%, which suits most photos.'],
      ['Drop your WebP files', 'Conversion starts straight away and each file shows its size before and after.'],
      ['Save the JPGs', 'Download them individually or press Download all.']
    ],
    sections: [
      ['Expect a larger file', 'WebP compresses better than JPG, so the JPG is usually bigger even though it cannot contain more detail than the WebP had. That is the price of compatibility. If the file has to stay small, lower the quality to around 80% rather than converting twice.'],
      ['Transparency becomes white', 'JPG has no transparent pixels. Logos, stickers and cut-out product shots get a white background. When you need the transparency, convert to PNG instead.'],
      ['Animated WebP', 'Only the first frame can become a JPG, since the format holds a single picture.'],
      ['Where JPG is still required', 'Government and exam portals, print shops, older versions of Photoshop and PowerPoint, digital photo frames and many e-mail newsletters expect JPG. Current browsers and phones do not need the conversion at all.']
    ],
    faq: [
      ['Do I lose quality?', 'A little, because JPG compresses the picture again. At 90% or above the difference is rarely visible.'],
      ['Can I convert many WebP files together?', 'Yes. Add as many as you like and press Download all. The browser then saves each JPG separately; for one ZIP file use the Universal Image Converter.'],
      ['Why did a website give me WebP in the first place?', 'Because it loads faster. Sites send WebP to browsers that support it, even when the link ends in .jpg.'],
      ['Can I choose a background colour?', 'Not here: it is always white. The Universal Image Converter lets you pick the colour.']
    ]
  },
  'png-to-webp': {
    lead: 'PNG screenshots, logos and graphics are often the heaviest files on a web page. Converting them to WebP keeps the transparency and usually cuts the size sharply, without installing anything.',
    howTo: [
      ['Pick a quality', 'Start at the default 92%. For photos saved as PNG, 80% is often enough.'],
      ['Add PNG files', 'You can drop a whole folder’s worth; each is converted in turn.'],
      ['Compare the sizes', 'Every row shows the PNG size and the WebP size, so you can see whether it was worth it.'],
      ['Download', 'One by one or all together.']
    ],
    sections: [
      ['Which PNGs shrink the most', 'Photographs saved as PNG shrink dramatically, because PNG stores every pixel without loss. Screenshots and flat graphics shrink too, but check thin text and sharp edges at 100% zoom, since lossy WebP can soften them.'],
      ['Quality 100%', 'In Chrome and Edge, 100% switches to lossless WebP, so the picture is preserved and the file is normally still smaller than the PNG. Safari cannot create WebP from this tool; the Universal Image Converter includes its own encoder for it.'],
      ['Using WebP on your site', 'All current browsers display WebP. Upload the file, change the extension in your HTML or CSS, and keep the PNG as your editable original. In WordPress you can upload WebP directly to the media library.'],
      ['When to stay with PNG', 'Keep PNG for files you will edit again, for print, and for services that reject WebP, which still includes a number of online forms and e-mail clients.']
    ],
    faq: [
      ['Is transparency kept?', 'Yes, including soft, semi-transparent edges.'],
      ['Can the WebP be larger than the PNG?', 'It can, with very small icons or images that already use only a few colours. The sizes are shown, so keep whichever is smaller.'],
      ['Does WebP help SEO?', 'Indirectly. Smaller images load faster, and loading speed is part of Core Web Vitals. The format itself is not a ranking factor.'],
      ['Can I get a ZIP?', 'Download all saves the files one after another. For a single ZIP use the Universal Image Converter.']
    ]
  },
  'gif-maker': {
    lead: 'Turn a handful of pictures into a looping animation: a product from several angles, the steps of a tutorial, or a burst of holiday photos. Add the frames in order, choose the speed and save the GIF.',
    howTo: [
      ['Add the frames in order', 'Frames play in the order you add them. You can add more images in several goes.'],
      ['Set the frame delay', 'From 80 to 1000 milliseconds. The default of 300 ms shows about three frames a second.'],
      ['Press Make GIF', 'The frames are combined on your device and the result shows its frame count and size.'],
      ['Download the animation', 'The file is called animation.gif.']
    ],
    sections: [
      ['The first picture decides the size', 'The GIF takes the width and height of the first image. Later images are fitted inside that area without stretching, and any space left over is white. For a clean result, crop all pictures to the same shape beforehand.'],
      ['Choosing a speed', '80 to 150 ms looks like motion and suits burst photos. 300 to 500 ms works for step-by-step demonstrations. 700 ms or more gives people time to read text on each frame.'],
      ['Keeping the file small', 'A GIF has at most 256 colours per frame and compresses poorly, so size grows quickly with dimensions and frame count. Resize your images to about 600 px wide first, use fewer than 20 frames, and run the result through the GIF Compressor if it is still too big.'],
      ['Why colours look different', 'Photos contain far more than 256 colours. Smooth skies and skin tones can show banding in any GIF. Drawings, interface captures and text look much better.']
    ],
    faq: [
      ['Which images can I use?', 'Anything your browser can open, such as JPG, PNG and WebP.'],
      ['Can I make a GIF from a video?', 'No. This tool works from still images.'],
      ['Can I change the order afterwards?', 'Not inside the tool. Press Start over and add the pictures again in the order you want.'],
      ['Can each frame have its own delay?', 'No, one delay applies to all frames. To hold a frame longer, add the same picture twice.']
    ]
  },
  'scan-to-pdf': {
    lead: 'Photograph receipts, contracts or homework with your phone or laptop camera and collect the pages in one PDF. You can also drop pictures you have already taken.',
    howTo: [
      ['Open the camera or add photos', 'Press Open camera and allow access, or drop JPG and PNG pictures of your pages.'],
      ['Capture each page', 'Every press of Capture page adds one page to the list.'],
      ['Put the pages in order', 'Use the arrows to move a page up or down, or the cross to remove it.'],
      ['Choose a page size and create the PDF', 'Fit to image, A4 or Letter.']
    ],
    sections: [
      ['Getting a readable scan', 'Lay the page on a darker, plain surface near a window. Hold the camera parallel to the paper so the edges stay straight, fill the frame, and avoid casting your own shadow. The tool does not straighten or brighten pictures, so the photo you take is the page you get.'],
      ['Which page size to choose', 'Fit to image makes every PDF page exactly as large as its photo, with no borders. A4 and Letter place the photo on a standard sheet with a small margin, turning the sheet sideways for landscape photos, which is better for printing.'],
      ['What the PDF contains', 'Each page is an image. You can read and print it, but you cannot search or select the text. To get the words out, run the photo through OCR Image to Text first.'],
      ['Privacy of scanned documents', 'The camera picture goes straight into the page and the PDF is built on your device. That matters for ID cards, medical letters and bank papers, which you may not want to pass through an online scanner’s server.']
    ],
    faq: [
      ['Does it need an app?', 'No. It uses the browser’s camera access. On phones the rear camera is requested.'],
      ['The camera does not start. What can I do?', 'Check that the browser is allowed to use the camera for this site. You can always photograph the pages normally and drop the pictures in.'],
      ['Does it crop or straighten the page?', 'No. Use the Image Cropper on the photo first if you need that.'],
      ['Is the text searchable?', 'No, the pages are pictures.']
    ]
  },
  'favicon-generator': {
    lead: 'Upload a logo and get every icon a website needs: a multi-size favicon.ico, PNG icons from 16 to 512 pixels and the HTML tags to paste into your pages.',
    howTo: [
      ['Upload your logo', 'A square PNG or SVG with a transparent background works best.'],
      ['Choose how to handle other shapes', 'Fit keeps the whole logo and adds transparent edges. Crop fills the square from the centre.'],
      ['Download the files', 'Save favicon.ico and the PNG sizes you need.'],
      ['Copy the HTML tags', 'Upload the files to your site’s root folder and paste the tags into the head of your pages.']
    ],
    sections: [
      ['What each file is for', 'favicon.ico holds 16, 32 and 48 px versions and is requested automatically by browsers and feed readers. The 32 px PNG is used for tabs on sharp screens, 180 px for the iPhone home screen, and 192 and 512 px for Android and installable web apps.'],
      ['Designing for 16 pixels', 'A complete logo with a company name turns into a grey smudge at 16 px. Use a single letter or a bold symbol, strong contrast and no thin lines. Look at the 16 px result before you publish it.'],
      ['Checking it works', 'Browsers keep icons for a long time. Open yoursite.com/favicon.ico directly, then reload the page in a private window. If the old icon is still there, add a version such as ?v=2 to the links.'],
      ['Favicons in Google results', 'Google shows a site’s icon next to mobile and desktop results. The icon should be square, reachable by crawlers and at least 8 × 8 px; a multiple of 48 px is recommended. It can take days or weeks to update.']
    ],
    faq: [
      ['Which sizes are created?', '16, 32, 48, 64, 128, 180, 192 and 512 px PNG files, plus favicon.ico with 16, 32 and 48 px inside.'],
      ['My logo is wide. Will it be stretched?', 'No. It is fitted with transparent edges or cropped to the centre, whichever you choose.'],
      ['Do I need a web manifest?', 'Only for an installable web app. A normal site works with the tags provided.'],
      ['Why is the iPhone icon black around the edges?', 'iOS does not support transparent home-screen icons. Add a solid background to your logo before uploading it.']
    ]
  },
  'pdf-organizer': {
    lead: 'See all pages of a PDF as thumbnails, drag them into a new order, turn the ones that are sideways and delete the ones you do not need. Then export a new PDF.',
    howTo: [
      ['Open your PDF', 'Thumbnails of all pages appear after a moment.'],
      ['Drag pages to reorder them', 'Drop a thumbnail where the page should go.'],
      ['Rotate or delete', 'Hover over a page and use the buttons. Each press of rotate turns it by 90 degrees.'],
      ['Export PDF', 'The new file contains the pages in the order you see.']
    ],
    sections: [
      ['When to use this instead of the single tools', 'Use the organizer when you need to see the pages to decide. If you already know the numbers, for example “delete pages 4 to 9”, the PDF Page Remover and PDF Page Rotator are faster because they accept ranges.'],
      ['What happens to the page contents', 'Pages are moved as they are, so text stays selectable and images keep their quality. Nothing is converted to a picture: the thumbnails are only for display.'],
      ['Typical jobs', 'Putting a cover sheet first, reversing a stack that was scanned from back to front, removing blank sides after a double-sided scan, or turning the landscape tables in a report.'],
      ['Large files', 'Every page is drawn once to make its thumbnail. A document with hundreds of pages takes time and memory, particularly on a phone; split it first with the PDF Splitter if it feels slow.']
    ],
    faq: [
      ['Can I combine two PDFs here?', 'No, one file at a time. Join them with the PDF Merger first, then arrange the pages here.'],
      ['Can I undo a deletion?', 'Not within the tool. Your original file is untouched, so open it again to start over.'],
      ['Does dragging work on a phone?', 'Page dragging uses the desktop drag-and-drop feature, so a computer is recommended for reordering.'],
      ['Can it open protected PDFs?', 'Remove the password with PDF Unlock first, if you know it.']
    ]
  },
  'word-counter': {
    lead: 'Paste or type a text and see words, characters, sentences, paragraphs and reading time change as you write. It also counts languages that do not put spaces between words.',
    howTo: [
      ['Paste or type your text', 'Nothing needs to be submitted.'],
      ['Read the numbers', 'Six figures update with every keystroke.'],
      ['Edit until it fits', 'Cut or add text directly in the box.']
    ],
    sections: [
      ['What counts as a word', 'Anything between spaces, so “well-known” is one word and “24/7” is one word, the same as in Word and Google Docs. Chinese, Japanese, Thai and similar scripts have no spaces, so the browser’s language rules are used to find the words.'],
      ['Characters, the human way', 'An emoji with a skin tone or a letter with an accent counts as one character, even though it may be stored as several codes. Some platforms count differently: X, for example, counts most emoji as two.'],
      ['Sentences and abbreviations', 'Full stops after titles and abbreviations such as Dr., e.g. or etc. do not end a sentence, and a line broken in the middle is not counted as a new one. Unusual abbreviations can still be misread.'],
      ['Useful limits', 'A search result title fits about 50 to 60 characters and a description about 150 to 160. A LinkedIn post allows 3,000 characters and an Instagram caption 2,200. Reading time assumes 200 words a minute.']
    ],
    faq: [
      ['Is my text stored?', 'No. It stays in the page and disappears when you close it.'],
      ['Why does Word show a different number?', 'Word can include footnotes and text boxes, and treats some symbols differently. Differences of a few words are normal.'],
      ['Are spaces counted as characters?', 'Both figures are shown: with and without spaces.'],
      ['How is a paragraph detected?', 'By an empty line between blocks of text.']
    ]
  },
  'ad-copy-gen': {
    lead: 'Fill in your product, the benefit it brings and who it is for, choose a tone, and get headlines, body text and calls to action to adapt. The suggestions come from templates, not from an AI model.',
    howTo: [
      ['Describe your offer', 'Enter the product, its main benefit and the audience in a few words each.'],
      ['Choose a tone', 'Professional, friendly, urgent or playful.'],
      ['Generate and pick', 'Use the lines that fit as a starting point and rewrite them in your own voice.']
    ],
    sections: [
      ['What it is good for', 'A blank page is the hardest part of writing an ad. Templates give you several angles at once: an outcome, a reassurance, a deadline, a joke. Expect to keep one or two ideas and edit them, not to publish everything as it stands.'],
      ['Make the benefit concrete', 'The templates repeat your words, so vague input gives vague ads. “Saves time” is weak. “Invoices sent in two minutes” gives every line something real to say.'],
      ['Claims you must be able to prove', 'Some templates use phrases such as “trusted by thousands” or “limited time”. Delete them unless they are true for you. Ad platforms reject misleading claims and consumer law in many countries forbids invented urgency or popularity.'],
      ['Fitting the platform', 'Google responsive search ads allow 30 characters per headline and 90 per description. Meta usually shows about 125 characters of primary text before cutting it off. Check your edited lines with the Word Counter.']
    ],
    faq: [
      ['Is this artificial intelligence?', 'No. It fills in prepared sentences with your words, which is why it is instant and works without an account.'],
      ['Which tones are available?', 'Professional, friendly, urgent and playful.'],
      ['Can I use the text commercially?', 'Yes. You are responsible for making sure the final ad is accurate.'],
      ['Does it work in other languages?', 'The templates are in English.']
    ]
  },
  'image-to-pdf': {
    lead: 'Put one or more pictures into a PDF that anyone can open and print. Mix JPG, PNG and WebP images, arrange them, choose a page size and save.',
    howTo: [
      ['Add your images', 'Drop JPG, PNG or WebP files. Each becomes one page.'],
      ['Arrange them', 'Move pages with the arrows or remove them with the cross.'],
      ['Choose the page size', 'Fit to image, A4 or Letter.'],
      ['Create PDF', 'The document is built on your device and saved.']
    ],
    sections: [
      ['Fit to image, A4 or Letter', 'Fit to image gives every page the exact shape of its picture and no border, good for viewing on a screen. A4 and Letter centre the picture on a standard sheet with a small margin and turn the sheet for landscape pictures, good for printing.'],
      ['Quality', 'JPG and PNG files are placed in the PDF unchanged, so there is no extra loss and the PDF is about as large as the pictures together. WebP is first converted to lossless PNG, which can make the file bigger.'],
      ['Making the PDF smaller', 'Compress or resize the pictures before you add them. For a form with a limit, use Compress Image to Exact KB on each picture; a PDF adds only a few kilobytes on top.'],
      ['One tool, four entrances', 'JPG to PDF, PNG to PDF and Multiple Images to PDF work the same way. The difference is which files they accept; this one takes all three formats.']
    ],
    faq: [
      ['Is there a limit on the number of images?', 'No fixed limit. Very many large photos depend on your device’s memory.'],
      ['Can I set my own margins?', 'No. A4 and Letter use one small margin, and Fit to image uses none.'],
      ['Can I put two pictures on one page?', 'Not here. Join them with the Image Collage tool first.'],
      ['Will the text in my pictures be searchable?', 'No, pictures stay pictures.']
    ]
  },
  'images-to-pdf': {
    lead: 'Made for batches: drop in a set of photos, receipts or scanned pages and get a single PDF with one picture per page, in the order you choose.',
    howTo: [
      ['Drop the whole set', 'JPG, PNG and WebP can be mixed, and you can add more afterwards.'],
      ['Check the order', 'The list shows every page with its position. Use the arrows to move one.'],
      ['Pick one page size for all', 'Fit to image, A4 or Letter.'],
      ['Create the PDF', 'One file is saved for the whole set.']
    ],
    sections: [
      ['Saving time on the order', 'Files are added in the order your computer hands them over, usually by name. Name them 01, 02, 03 before you select them and you will rarely need to move anything.'],
      ['Mixed orientations', 'Portrait and landscape photos can share a document. With A4 or Letter each sheet is turned to match its picture, so nothing is shrunk unnecessarily.'],
      ['Expense reports and claims', 'Photograph the receipts, drop them in date order and send one attachment instead of fifteen. If the recipient has a size limit, compress the photos first; receipts stay legible at about 1,200 px on the long side.'],
      ['Photo hand-outs', 'For a contact sheet or a small album choose Letter or A4. For a portfolio that will be read on a screen choose Fit to image, which removes white borders.']
    ],
    faq: [
      ['How is this different from Image to PDF?', 'The result is the same. This page is set up for adding many files at once.'],
      ['Can I add images in several steps?', 'Yes. New files are added to the end of the list.'],
      ['Are the photos compressed?', 'JPG and PNG go in unchanged. WebP is converted to PNG.'],
      ['Can I merge the result with another PDF?', 'Yes, with the PDF Merger.']
    ]
  },
  'heic-to-jpg': {
    lead: 'Photos from an iPhone arrive as HEIC files that many Windows programs, websites and printers cannot open. Convert them to JPG, or to PNG when you need lossless quality, in batches and without an upload.',
    howTo: [
      ['Choose JPG or PNG', 'JPG is right for nearly everything. For JPG you can set the quality from 60% to 100%.'],
      ['Drop your HEIC or HEIF files', 'Copy them from the phone or a cloud folder; several can be added together.'],
      ['Wait for each file', 'The first conversion may download a decoder if your browser has none.'],
      ['Download', 'Each finished photo has its own button.']
    ],
    sections: [
      ['Why it can take a moment', 'Safari can read HEIC by itself. Chrome, Edge and Firefox on Windows usually cannot, so a decoder is loaded once and runs inside the page. Large photos can take a few seconds each.'],
      ['What you keep and lose', 'You keep the full picture. You lose extras that only HEIC can hold: Live Photo movement, depth maps, bursts and wide-gamut colour. Location and camera data may be dropped too.'],
      ['Stop your iPhone from making HEIC', 'Open Settings, Camera, Formats and choose Most Compatible. New photos are then saved as JPG and take roughly twice the space. When sending by cable, Settings, Photos, Transfer to Mac or PC, Automatic converts them during the copy.'],
      ['Need another format?', 'The Universal Image Converter reads HEIC as well and can create WebP, AVIF or PNG, with resizing and a ZIP download.']
    ],
    faq: [
      ['Are my photos uploaded?', 'No. The decoder is downloaded to your browser and the photos stay on your device.'],
      ['JPG or PNG?', 'JPG for sharing and printing. PNG is many times larger and only useful if you will edit the picture repeatedly.'],
      ['Can I convert a Live Photo?', 'Only the still picture. The short video is a separate MOV file.'],
      ['Why did one file fail?', 'It may be incomplete, for example a photo still stored in iCloud and not fully downloaded. Open it on the phone first and export it again.']
    ]
  },
  'pdf-page-remover': {
    lead: 'Delete pages from a PDF by typing their numbers. It is the quickest way to drop a cover sheet, an advert or a block of blank pages when you know where they are.',
    howTo: [
      ['Open the PDF', 'The number of pages is shown.'],
      ['Type the pages to remove', 'Single numbers and ranges, separated by commas: 2, 4-6.'],
      ['Press Remove pages', 'A new file called edited.pdf is saved.']
    ],
    sections: [
      ['Page numbers are counted from the first sheet', 'Use the position in the file, not the number printed on the page. If a report has a cover and a table of contents, printed page 1 may be the third page of the PDF.'],
      ['What stays', 'The remaining pages are untouched: text can still be selected and images are not compressed again. Links inside the document that pointed to a removed page will no longer work.'],
      ['The file may not shrink much', 'A PDF often stores fonts and pictures once for the whole document. If removed pages shared them with others, they stay. Run the PDF Compressor afterwards if the size matters.'],
      ['Is the removed content really gone?', 'The pages are taken out of the new file, but when a document holds confidential information, open the result and search it before sending. For single words or lines, removing pages is not the same as redacting.']
    ],
    faq: [
      ['Can I see the pages first?', 'This tool works by number. To choose from thumbnails, use the PDF Organizer.'],
      ['Can I remove every page?', 'No, at least one page has to remain.'],
      ['Is my original kept?', 'Yes, the result is a separate file.'],
      ['I want to keep only a few pages. Is there a faster way?', 'Yes, the PDF Splitter extracts a range.']
    ]
  },
  'pdf-page-rotator': {
    lead: 'Turn pages that were scanned sideways or upside down, either the whole document or only the pages you list, and save the change permanently.',
    howTo: [
      ['Open the PDF', 'The page count appears.'],
      ['Choose the angle', '90, 180 or 270 degrees clockwise.'],
      ['List pages or leave it blank', 'Blank rotates everything. Otherwise type numbers and ranges such as 1-3, 5.'],
      ['Press Rotate PDF', 'The result is saved as rotated.pdf.']
    ],
    sections: [
      ['Which angle do I need?', 'If the top of the text points to the left, choose 90. If the page is upside down, choose 180. If the top points to the right, choose 270.'],
      ['Permanent, not just a view', 'Rotating in a PDF viewer often changes only what you see. Here the rotation is written into the file, so it looks right for everyone who opens or prints it.'],
      ['Nothing is re-encoded', 'Each page has a rotation setting, and the tool changes that setting. Scans keep their quality, text stays selectable and the file size hardly changes.'],
      ['Mixed documents', 'When some pages lean left and others right, run the tool twice with different page lists, or use the PDF Organizer, where each page has its own rotate button.']
    ],
    faq: [
      ['Is the angle added to an existing rotation?', 'Yes. If a page is already turned by 90 degrees and you choose 90, it ends up at 180.'],
      ['Can I straighten a page that is slightly crooked?', 'No. Only quarter turns are possible.'],
      ['Can I rotate only odd or even pages?', 'Type them as a list, for example 1, 3, 5, 7.'],
      ['Does it work on a protected PDF?', 'Unlock the file first with its password.']
    ]
  },
  'lorem-ipsum': {
    lead: 'Generate placeholder text for layouts, mock-ups and test data: up to 100 paragraphs, 500 sentences or 10,000 words, with or without the familiar opening.',
    howTo: [
      ['Choose the unit', 'Paragraphs, sentences or words.'],
      ['Enter how many', 'The tool tells you if you ask for more than the maximum.'],
      ['Decide about the opening', 'Tick the box to start with “Lorem ipsum dolor sit amet”.'],
      ['Copy the text', 'Press Generate again for a different version.']
    ],
    sections: [
      ['Different every time', 'Sentences are put together at random from a list of Latin words, between 8 and 16 words long, in paragraphs of four to seven sentences. Repeated blocks would make a layout look more regular than real text does.'],
      ['Why designers use it', 'Readable text draws attention to itself. Meaningless text with a natural rhythm lets people judge spacing, line length and hierarchy instead of correcting the wording.'],
      ['When not to use it', 'Lorem ipsum hides problems that real content reveals: a long product name, a missing photo caption, a heading in German. Replace it as early as you can, and search for “lorem” before you launch.'],
      ['Where the words come from', 'The classic passage is a scrambled extract from Cicero’s “De finibus bonorum et malorum”, written in 45 BC. Printers were using it as dummy text long before computers.']
    ],
    faq: [
      ['What is the most I can generate?', '100 paragraphs, 500 sentences or 10,000 words at a time.'],
      ['Is it real Latin?', 'The words are Latin, or nearly so, but the sentences have no meaning.'],
      ['Can I get HTML paragraphs?', 'The output is plain text with a blank line between paragraphs.'],
      ['Is it safe to publish by accident?', 'It does no harm, but visitors and search engines see it as unfinished content.']
    ]
  },
  'pdf-to-text': {
    lead: 'Pull the words out of a PDF into a plain text box, ready to copy or save as a .txt file. Useful for quoting, translating, searching or feeding text into another program.',
    howTo: [
      ['Drop a PDF', 'Extraction starts by itself.'],
      ['Check the result', 'The text appears in a box where you can correct it.'],
      ['Copy or download', 'Copy everything or save extracted-text.txt.']
    ],
    sections: [
      ['Scanned or digital?', 'Try selecting a word in your PDF viewer. If that works, the file contains text and this tool can read it. If the whole page is selected as a picture, it is a scan and the tool will tell you that no text was found; use OCR Image to Text on the page images instead.'],
      ['How the layout changes', 'All text of one page is joined into one block, with a blank line between pages. Line breaks, columns, bold type and tables are not reproduced. In documents with several columns, the order follows how the text is stored in the file, which is usually but not always how you would read it.'],
      ['Need the table, not the words?', 'PDF to Excel rebuilds rows and columns. For figures it is almost always the better choice.'],
      ['Odd characters', 'Some PDFs use fonts that do not record which letter each shape stands for. The text then looks fine on the page but comes out as symbols, in any extraction tool. OCR is the way around it.']
    ],
    faq: [
      ['Does it read scanned documents?', 'No, only text that is stored in the PDF.'],
      ['Are headers and page numbers included?', 'Yes, they are part of the page text.'],
      ['Can I extract only some pages?', 'Split the PDF first, then extract.'],
      ['Is the text kept anywhere?', 'No. It exists only in the open page.']
    ]
  },
  'html-to-pdf': {
    lead: 'Paste HTML, with inline or embedded CSS, and get a PDF of how it looks. Handy for invoices, e-mail templates, certificates and snippets of documentation.',
    howTo: [
      ['Paste your HTML', 'A fragment is enough; a full page also works.'],
      ['Choose paper and orientation', 'A4, Letter or Legal, portrait or landscape.'],
      ['Press Render to PDF', 'The HTML is drawn at the paper’s width and split into pages.']
    ],
    sections: [
      ['It is a picture of your page', 'The HTML is rendered and placed in the PDF as an image. Layout and colours match closely, but text in the PDF cannot be selected or searched. If you need real text, use your browser’s Print command and choose Save as PDF.'],
      ['What is supported', 'Style tags and inline styles are kept, including modern colour functions such as oklch and color-mix, which are converted first. Scripts and event handlers are removed for safety, so content created by JavaScript will not appear.'],
      ['Images', 'Pictures embedded as data URIs always work. Pictures from another site appear only if that site allows cross-origin access; many do not, and then the space stays empty.'],
      ['Avoiding ugly page breaks', 'Pages are cut at a fixed height, so a line or picture can be split. Keep important blocks short, add space before headings, or prepare each page as a separate piece of HTML.']
    ],
    faq: [
      ['Can I enter a web address?', 'No. Copy the page’s HTML source and paste it.'],
      ['Why is my external stylesheet missing?', 'Linked files are not loaded reliably. Put the CSS in a style tag.'],
      ['Can I set margins?', 'There is a fixed space around the content. Add padding in your own CSS for more.'],
      ['Are web fonts used?', 'Only fonts already available on your device are dependable.']
    ]
  },
  'txt-to-pdf': {
    lead: 'Turn plain text into a tidy PDF: notes, letters, logs or code. Paste the text or load a .txt file, choose A4 or Letter and save. Hindi, Urdu, Arabic, Chinese and other scripts are supported.',
    howTo: [
      ['Paste or load your text', 'Use the Load .txt button for a file.'],
      ['Choose A4 or Letter', 'The text is set at 12 points with even margins.'],
      ['Create PDF', 'Long lines are wrapped and new pages are added as needed.']
    ],
    sections: [
      ['Two ways of writing the page', 'Text in Western European letters is written as real text, so you can select and search it and the file is tiny. If the text contains other scripts, symbols such as ₹, or emoji, the pages are drawn by your browser and stored as images, because the PDF’s built-in font has no such characters. The tool tells you when that happens.'],
      ['Right-to-left languages', 'Paragraphs in Arabic, Urdu or Hebrew are aligned to the right and letters are joined correctly, since the browser’s own text engine draws them.'],
      ['Formatting', 'Plain text has no bold, headings or tables, so none appear. Tabs become four spaces. Lines that are too long wrap at a word where possible.'],
      ['When Markdown or Word is better', 'For headings and lists, write Markdown, convert it with Markdown to HTML and then use HTML to PDF. For a .docx file use Word to PDF.']
    ],
    faq: [
      ['Can I change the font or size?', 'No. The tool uses one clean sans-serif font at 12 points.'],
      ['Why can’t I select the text in my PDF?', 'Because it contains characters outside Western European letters, so the pages were saved as images.'],
      ['Are line breaks kept?', 'Yes, every line break in your text starts a new line.'],
      ['Is there a length limit?', 'No fixed limit. Very long text in image mode takes longer and makes a larger file.']
    ]
  },
  'image-resizer': {
    lead: 'Change the pixel size of one image or a whole batch. Enter a width or height, or pick a percentage, keep the proportions locked and save as JPG, PNG or WebP.',
    howTo: [
      ['Add one or more images', 'JPG, PNG and WebP.'],
      ['Enter a size or choose a scale', '25%, 50%, 75% or 200%, or your own width and height.'],
      ['Keep the ratio locked', 'Unlock it only if you want to stretch the picture.'],
      ['Choose the format and download', 'Each image is saved in the format you select.']
    ],
    sections: [
      ['How batches work', 'With the ratio locked, every image gets the width you typed and its own matching height, so portrait and landscape pictures are not distorted. A percentage applies to each image individually.'],
      ['Sizes worth knowing', 'A full-width website photo rarely needs more than 1,920 px. A blog image is fine at 1,200 px, an e-mail picture at 600 to 800 px. An Instagram portrait post is 1080 × 1350 px and a YouTube thumbnail 1280 × 720 px.'],
      ['Smaller is safe, larger is not', 'Reducing an image keeps it crisp. Enlarging to 200% spreads the same detail over more pixels and looks softer. For real enlargement try the AI Image Upscaler.'],
      ['Pixels are not kilobytes', 'Halving width and height removes three quarters of the pixels and usually cuts the file by more than half, but the exact size depends on the content. If a form demands a number of KB, use Compress Image to Exact KB.']
    ],
    faq: [
      ['Will my image be stretched?', 'Not while Lock ratio is ticked.'],
      ['Can I resize in centimetres or inches?', 'Multiply by the print resolution: 10 cm at 300 dpi is about 1,181 px.'],
      ['Does transparency survive?', 'Choose PNG or WebP. JPG cannot store it.'],
      ['Can I crop as well?', 'Use the Image Cropper first, then resize.']
    ]
  },
  'color-picker': {
    lead: 'Upload a picture and point at any spot to read its colour as HEX and RGB. Useful for matching a brand colour, sampling a photo or rebuilding a design.',
    howTo: [
      ['Add an image', 'Any format your browser can display.'],
      ['Move over the picture', 'The colour under the pointer is shown live.'],
      ['Click to lock', 'The value stays while you copy it. Click again to continue sampling.'],
      ['Copy HEX or RGB', 'Both are ready in text fields.']
    ],
    sections: [
      ['Why neighbouring points differ', 'What looks like one flat colour in a photo is usually many slightly different ones, caused by light, texture and JPG compression. Sample a few nearby points and choose the middle one.'],
      ['Displayed size matters', 'Large pictures are scaled down to fit the page and colours are read from that smaller copy. In flat areas the value is the same; on thin lines and edges it can be a blend. For a tiny detail, crop the image first.'],
      ['From colour to palette', 'If you need the main colours of a logo instead of one point, the Brand Color Extractor finds them for you. To turn one colour into a matching scheme, use the Color Palette Generator.'],
      ['Screen and print', 'HEX and RGB describe colours on a screen. Printed ink looks different, so a print shop should convert the value to CMYK or a spot colour.']
    ],
    faq: [
      ['Which formats are shown?', 'HEX and RGB. For HSL, paste the HEX value into the Color Code Converter.'],
      ['Can I collect several colours?', 'One at a time. Copy each value before you move on.'],
      ['Can it pick colours from a website?', 'Take a screenshot and upload that.'],
      ['Does it work on a phone?', 'Tap the picture to lock a colour. A mouse is more precise.']
    ]
  }
};
