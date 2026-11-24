/* tool-guides-2.js — more page-specific text; see tool-guides.js for the rules. */
'use strict';
module.exports = {
  /* ── Images ── */
  'image-compressor': {
    lead: 'Make photos lighter for websites, e-mail and uploads. Set one quality for a whole batch, let the tool choose JPG or WebP, and see exactly how much each file shrank.',
    howTo: [
      ['Add your images', 'JPG, PNG and WebP, one or many.'],
      ['Set the quality', 'From 10% to 100%. The default of 75% is a good start for photos.'],
      ['Choose the output', 'Automatic picks JPG, or WebP when the picture has transparency.'],
      ['Compress and download', 'Each row shows the size before and after.']
    ],
    sections: [
      ['Files that cannot shrink', 'If compressing would make a file larger, the original is returned and marked as already optimised. This is common with images downloaded from social networks, which have been compressed before.'],
      ['Finding the right quality', 'Try 75%, then 60%. Look at faces, text and smooth skies, where damage shows first. Below about 40% blocks and colour fringes become obvious.'],
      ['PNG input', 'A PNG photo becomes a JPG and often loses most of its weight. A PNG with transparency becomes WebP so the see-through areas survive; choosing JPG fills them with white.'],
      ['Compress or resize?', 'A 4,000 px photo shown at 800 px wastes most of its data. Reduce it with the Image Resizer first and compress afterwards. When a form names a limit in KB, use Compress Image to Exact KB.']
    ],
    faq: [
      ['Does it keep the file format?', 'Automatic saves pictures without transparency as JPG and the others as WebP. Choose WebP to get WebP for everything. PNG is never the output, because it has no quality setting.'],
      ['Are dimensions changed?', 'No, width and height stay the same.'],
      ['Is photo information kept?', 'Compressed copies no longer contain location or camera data.'],
      ['Why is my saving so small?', 'The picture was probably compressed already, or it contains a lot of fine detail such as foliage or grain.']
    ]
  },
  'image-cropper': {
    lead: 'Cut a picture to the part that matters. Drag a box over the image, lock it to a common shape such as a square or 16:9, and save the crop at full resolution in the same format.',
    howTo: [
      ['Open a JPG, PNG or WebP', 'A box appears over the picture.'],
      ['Choose a shape', 'Free, 1:1, 4:3, 16:9 or 3:2.'],
      ['Move and resize the box', 'Drag inside to move it and drag a corner to resize it. Touch works too.'],
      ['Press Crop & download', 'The new dimensions are shown.']
    ],
    sections: [
      ['Full resolution, not the preview', 'Large photos are displayed smaller so they fit the page, but the crop is taken from the original pixels.'],
      ['Which shape for what', '1:1 for profile pictures and product tiles, 4:3 for presentations and many cameras, 3:2 for prints such as 6 × 4 inches, 16:9 for video thumbnails and wide headers.'],
      ['Composing a better picture', 'Leave a little room in the direction a person is looking, keep horizons off the exact middle and avoid cutting people at the joints. A tighter crop is usually stronger than a wide one.']
    ],
    faq: [
      ['Does cropping reduce quality?', 'PNG crops are exact. JPG and WebP are saved once more, with no visible change in normal use.'],
      ['Can I type exact pixel values?', 'No. Crop to the right shape, then set the size in the Image Resizer.'],
      ['Can I crop to a circle?', 'Not here. Crop to a square; most sites apply the round mask themselves.'],
      ['Is transparency kept?', 'Yes for PNG and WebP.']
    ]
  },
  'jpg-to-png': {
    lead: 'Save JPG pictures as PNG when a program insists on it, or before editing, so that repeated saving no longer adds compression damage. Several files can be converted together.',
    howTo: [
      ['Drop your JPG files', 'They are converted as soon as you add them.'],
      ['Check the list', 'Each row shows the old and the new size.'],
      ['Download', 'One by one, or all in a row.']
    ],
    sections: [
      ['What PNG does and does not improve', 'PNG stores every pixel as it is now. It stops further loss, but it cannot bring back detail that JPG compression already removed, and it does not make a blurred picture sharper.'],
      ['Expect big files', 'A photo can become five to ten times larger. That is normal for PNG and the reason photos on the web are rarely published in it.'],
      ['No automatic transparency', 'The white background of a JPG logo stays white. To cut it out use the Background Remover, which saves a transparent PNG.'],
      ['Good reasons to convert', 'Adding text or layers in an editor, screenshots you will annotate several times, or upload forms that accept only PNG.']
    ],
    faq: [
      ['Is there a quality setting?', 'No. PNG is lossless.'],
      ['Will the picture look different?', 'It looks the same as the JPG you put in.'],
      ['Can I make the PNG smaller?', 'Reduce its dimensions, or use WebP if your site allows it.'],
      ['Is rotation from the camera respected?', 'Yes, the picture is saved the right way up.']
    ]
  },
  'png-to-jpg': {
    lead: 'Turn heavy PNG files into compact JPGs for e-mail, forms and documents. Set the quality once and convert as many as you need.',
    howTo: [
      ['Set the quality', '50% to 100%; 92% is the starting value.'],
      ['Drop PNG files', 'Conversion starts straight away.'],
      ['Download the JPGs', 'Individually or all together.']
    ],
    sections: [
      ['Photos yes, line art no', 'Photographs saved as PNG can shrink by 80% or more. Screenshots with text, diagrams and logos often get fuzzy edges in JPG and sometimes even grow. For those keep PNG or use PNG to WebP.'],
      ['What happens to transparency', 'JPG has none, so transparent areas become white. If your logo will sit on a coloured page, that white box will be visible.'],
      ['Choosing the quality', 'Use 90% or more for printing, 80% for web pages and 60 to 70% for quick previews. Compare the sizes shown in the list.']
    ],
    faq: [
      ['Can I choose another background colour?', 'Here it is always white. The Universal Image Converter lets you pick one.'],
      ['Why is my JPG larger than the PNG?', 'The PNG had only a few colours, which PNG compresses very well. Keep the PNG.'],
      ['Can I go back to PNG later?', 'You can convert, but the detail lost in JPG does not return. Keep the original.'],
      ['Are many files saved as a ZIP?', 'No, one after another. The Universal Image Converter makes ZIP files.']
    ]
  },
  'jpg-to-webp': {
    lead: 'Make photos for your website lighter by saving them as WebP. At similar visible quality a WebP file is usually a quarter to a third smaller than the JPG.',
    howTo: [
      ['Choose a quality', 'Start at 80 to 85% for web pages.'],
      ['Add your JPG files', 'A whole gallery is fine.'],
      ['Compare and download', 'Every row shows both sizes.']
    ],
    sections: [
      ['Start from the original', 'Converting a JPG that was already squeezed hard carries its blocks into the WebP and saves little. Use the photo from the camera or the stock site.'],
      ['Why it helps a website', 'Pictures are normally the heaviest part of a page. Lighter ones improve Largest Contentful Paint, one of the Core Web Vitals, especially on mobile connections.'],
      ['Publishing it', 'All current browsers show WebP. For very old ones add a JPG through the HTML picture element. WordPress and most shop systems accept WebP uploads directly.'],
      ['Even smaller', 'AVIF often beats WebP. The Universal Image Converter can create it, at the cost of a slower conversion.']
    ],
    faq: [
      ['Do I lose quality?', 'A little, as in any lossy saving. At 85% it is hard to see.'],
      ['Can the WebP be larger?', 'Yes, with high settings on a heavily compressed JPG. Then lower the quality or keep the JPG.'],
      ['Does it work in Safari?', 'Safari shows WebP but cannot create it with this tool. Use the Universal Image Converter there.'],
      ['Is camera information kept?', 'No, only the picture.']
    ]
  },
  'webp-to-png': {
    lead: 'Open WebP pictures in programs that do not know the format. PNG keeps the transparency and every pixel, which makes it the safe choice for logos, stickers and graphics you want to edit.',
    howTo: [
      ['Drop WebP files', 'One or several; they are converted immediately.'],
      ['Download the PNGs', 'Separately or with Download all.']
    ],
    sections: [
      ['PNG or JPG?', 'Choose PNG for anything with transparent areas, text or flat colours. Choose WebP to JPG for ordinary photos, where PNG would be many times larger.'],
      ['Nothing is lost in this step', 'PNG is lossless, so the result matches the WebP as decoded by your browser. Damage from an earlier lossy WebP stays visible, but no more is added.'],
      ['Animated stickers', 'Only the first frame is saved. To keep movement you need a video or GIF tool; a still PNG cannot hold it.'],
      ['Using stickers elsewhere', 'Chat stickers are usually 512 × 512 px WebP files with transparency. As PNG they can be placed in slides, documents and design programs.']
    ],
    faq: [
      ['Is transparency preserved?', 'Yes, including soft edges.'],
      ['Why is the PNG so much bigger?', 'WebP compresses far better. Size is the price of a lossless, widely supported file.'],
      ['Can I convert many at once?', 'Yes.'],
      ['Can I set the size?', 'Not here. Use the Image Resizer, or resize during conversion in the Universal Image Converter.']
    ]
  },
  'png-to-svg': {
    lead: 'Trace a logo, icon or signature into an SVG that stays sharp at any size and can be recoloured. The tool finds the main colours and draws the outline of each as an editable shape.',
    howTo: [
      ['Load the image', 'PNG, WebP or JPG. Clean, flat artwork works best.'],
      ['Choose the number of colours', '2 to 16. Use as few as the design really has.'],
      ['Set detail and curves', 'Simple, Balanced or Detailed; smooth curves keep real corners sharp.'],
      ['Trace and compare', 'Original and SVG appear side by side.']
    ],
    sections: [
      ['Why few colours are better', 'Soft edges in a picture contain dozens of in-between shades. Asking for 16 colours in a two-colour logo creates thin slivers around every shape. Start with the true number and add one only if something is missing.'],
      ['Use a large source', 'Tracing follows pixels. A 100 px icon gives a bumpy outline, a 1,000 px version of the same icon gives a smooth one.'],
      ['Photos are not suitable', 'A photo turns into a poster-like picture with large files and no extra sharpness. Keep photos as JPG, WebP or AVIF.'],
      ['Editing the result', 'Each colour is one path with its own fill, including holes such as the inside of an O. Open the file in Illustrator, Inkscape or Figma, or change the colour codes in a text editor.']
    ],
    faq: [
      ['Is it just a PNG inside an SVG?', 'No. The shapes are real vector paths.'],
      ['Is transparency kept?', 'Yes, transparent areas are not traced.'],
      ['Can it recognise text?', 'Letters become shapes, not editable text.'],
      ['Can I use it for a cutting machine?', 'Often, with two colours and Simple detail. Check the paths in your cutter’s software.']
    ]
  },
  'svg-to-jpg': {
    lead: 'Turn a vector drawing into a picture that documents, e-mails and social networks accept: JPG with a white background, or PNG with transparency, from 256 to 2048 pixels wide.',
    howTo: [
      ['Choose JPG or PNG', 'JPG has a quality slider, PNG keeps transparency.'],
      ['Pick the width', '256, 512, 1024 or 2048 px. The height follows the drawing.'],
      ['Drop your SVG files', 'Changing a setting converts them again.'],
      ['Download', 'Each file has its own button.']
    ],
    sections: [
      ['Pick the size you need now', 'An SVG can be enlarged without limit, a JPG cannot. Choose the largest size you will use, such as 2048 px for a slide or a print.'],
      ['Missing fonts', 'If the SVG names a font that is not on your device, another one is used. Convert text to outlines in your design program before exporting the SVG.'],
      ['Missing pictures', 'Images and style sheets linked from other addresses are blocked inside an SVG for safety. Embed them before converting.'],
      ['JPG or PNG?', 'Logos and icons belong in PNG: sharp edges, no white box. Choose JPG for illustrations with gradients or when a form asks for it.']
    ],
    faq: [
      ['Why is the background white?', 'JPG cannot be transparent. Select PNG to keep it.'],
      ['Can I enter any width?', 'No, there are four sizes. The Image Resizer does exact values afterwards.'],
      ['My SVG comes out square or distorted. Why?', 'It probably has no width, height or viewBox, so the proportions are unknown. Add a viewBox.'],
      ['Can I convert several files?', 'Yes, drop them together.']
    ]
  },
  'watermark-image': {
    lead: 'Mark a picture with your name or logo before you share it. Place the mark in a corner, in the centre or repeated across the image, and control its size, strength and angle.',
    howTo: [
      ['Open your image', 'JPG, PNG or WebP. The preview updates with every change.'],
      ['Type a text or choose a logo', 'A logo replaces the text. Transparent PNG or SVG logos look best.'],
      ['Adjust it', 'Position, size, opacity, rotation and text colour.'],
      ['Download', 'The file keeps its original format and dimensions.']
    ],
    sections: [
      ['Corner or tiled?', 'A small mark in a corner looks professional but can be cropped away. Tiled marks across the whole picture are hard to remove and suit previews for clients.'],
      ['How strong should it be?', '30 to 50% opacity is readable without ruining the picture. White text works on most photos; choose a dark colour for bright product shots.'],
      ['What it cannot do', 'No visible watermark is impossible to remove, and AI tools are getting better at it. Share smaller versions, keep the originals and treat the mark as a signature rather than a lock.']
    ],
    faq: [
      ['Can I use text and a logo together?', 'Not in one step. Save with one, then open the result and add the other.'],
      ['Can I mark many pictures at once?', 'No, one at a time.'],
      ['Does the quality change?', 'PNG stays lossless. JPG and WebP are saved again at 92%.'],
      ['Is the position kept for the next picture?', 'Yes, the settings stay until you change them or start over.']
    ]
  },
  'qr-code-generator': {
    lead: 'Create a QR code for a link, a text, an e-mail address or a Wi-Fi network, in your own colours, and save it as a PNG. The code never expires because it contains the information itself.',
    howTo: [
      ['Choose the type', 'Link, Text, Email or Wi-Fi.'],
      ['Enter the content', 'The code is redrawn as you type.'],
      ['Set the colours', 'Keep the foreground clearly darker than the background.'],
      ['Download the PNG', 'Scan it once with a phone before you print it.']
    ],
    sections: [
      ['Static codes', 'There is no redirect, no counter and no subscription behind the code. It also means you cannot change it later: if the link may change, encode an address on your own site that you can redirect.'],
      ['Size and distance', 'A rule of thumb is one tenth of the scanning distance: 2 cm for a leaflet, 10 cm for a poster read from a metre away. Leave an empty margin around it. Short links make coarser patterns that scan more easily.'],
      ['Wi-Fi codes', 'Guests scan and connect without typing. Anyone who can photograph the code has the password, so use a guest network.'],
      ['Colours that work', 'Scanners need contrast. Avoid light codes on dark backgrounds, pastel shades and busy pictures behind the code.']
    ],
    faq: [
      ['Does the code expire?', 'No.'],
      ['Can I see how often it was scanned?', 'Not with a static code. Use a link with UTM parameters and look in your analytics.'],
      ['Can I add a logo in the middle?', 'Not here. Covering part of the code also makes it harder to read.'],
      ['How much text fits?', 'A few hundred characters scan comfortably. The tool tells you when the content is too long.']
    ]
  },
  'ocr-image-to-text': {
    lead: 'Copy the words out of a screenshot, a scanned page or a photographed sign. Choose one of eight languages, drop the image and correct the result before saving it.',
    howTo: [
      ['Choose the language first', 'English, Hindi, French, German, Spanish, Japanese, Simplified Chinese or Arabic.'],
      ['Drop one image', 'The recognition engine and the language data are downloaded on first use.'],
      ['Watch the progress', 'A large picture can take a minute on a slow device.'],
      ['Copy or save', 'Copy the text or download a .txt file.']
    ],
    sections: [
      ['What gives good results', 'Printed text, dark on light, level and in focus, with letters at least 20 px high. Crop away pictures and borders first, and photograph pages in daylight without glare.'],
      ['The language matters', 'The engine compares shapes with the words of the chosen language. English selected for a Hindi page produces nonsense. For mixed pages run it twice.'],
      ['What it struggles with', 'Handwriting, decorative fonts, curved packaging, text over photos and complicated tables. For tables in a PDF try PDF to Excel.'],
      ['Always proofread numbers', '0 and O, 1 and l, 5 and S are easily confused. Check amounts, phone numbers and IBANs against the picture.']
    ],
    faq: [
      ['Is my image uploaded?', 'No. The engine runs in your browser; only the program and language files are downloaded.'],
      ['Can it read a PDF?', 'Convert the pages with PDF to JPG first.'],
      ['Are columns and layout kept?', 'Lines are kept roughly. Columns can be mixed up; crop and read them one at a time.'],
      ['Does it read handwriting?', 'Not reliably. It is made for printed text.']
    ]
  },
  /* ── PDF ── */
  'pdf-merger': {
    lead: 'Join several PDFs into one document in the order you choose. Contracts and their appendices, monthly statements, or chapters of a report end up in a single file.',
    howTo: [
      ['Add two or more PDFs', 'You can add more later.'],
      ['Arrange the order', 'Use the arrows to move a file up or down, or the cross to remove it.'],
      ['Press Merge PDFs', 'The result is saved as merged.pdf, with the total page count shown.']
    ],
    sections: [
      ['Pages are copied, not redrawn', 'Text stays searchable, images keep their quality and different page sizes can sit side by side.'],
      ['What may not survive', 'Bookmarks and document properties of the separate files are not carried over, and interactive forms can lose functions. Digital signatures become invalid, as they do after any change.'],
      ['Only some of the pages?', 'Take them out with the PDF Splitter first, or merge everything and delete the rest in the PDF Organizer.'],
      ['Big results', 'The merged file is about as large as the parts together. Run the PDF Compressor before e-mailing it.']
    ],
    faq: [
      ['Can I merge password-protected PDFs?', 'Remove the passwords with PDF Unlock first. If one file is protected, nothing is merged and you are told which.'],
      ['How many files can I join?', 'There is no fixed number; memory is the limit.'],
      ['Can I mix PDFs and pictures?', 'Convert the pictures with Image to PDF, then merge.'],
      ['Is the order by name?', 'Files appear in the order you add them.']
    ]
  },
  'pdf-splitter': {
    lead: 'Take the pages you need out of a PDF. Extract a range into one new file, or save every page as its own PDF.',
    howTo: [
      ['Open the PDF', 'The number of pages is shown.'],
      ['Choose a mode', 'Extract range, or Split every page.'],
      ['Type the pages', 'For example 1-3, 5. Pages are always saved in their original order.'],
      ['Press Split PDF', 'A range is saved as split-pages.pdf; single pages appear in a list.']
    ],
    sections: [
      ['Count sheets, not printed numbers', 'Page 1 is the first sheet of the file. If a cover and contents come first, printed page 1 may be number 3.'],
      ['Typical uses', 'Sending one invoice from a yearly file, separating a chapter for a class, or keeping the signature page of a contract.'],
      ['The size of the parts', 'A single page can be larger than expected when it uses fonts and logos that were shared by the whole document; each part needs its own copy.']
    ],
    faq: [
      ['Can I repeat or reorder pages?', 'For arranging pages the PDF Organizer is easier, because you see them.'],
      ['Are the single pages packed in a ZIP?', 'No, each has its own download button.'],
      ['Does the quality change?', 'No, pages are copied as they are.'],
      ['Can I split by file size?', 'No, only by page numbers.']
    ]
  },
  'pdf-compressor': {
    lead: 'Shrink a PDF by recompressing the photos inside it, while text, links and layout remain exactly as they were. Ideal for scans, brochures and reports with pictures.',
    howTo: [
      ['Open your PDF', 'Its size is shown.'],
      ['Choose a level', 'Light, Balanced or Strong.'],
      ['Press Compress PDF', 'Pictures are processed one by one.'],
      ['Compare and download', 'You see both sizes and the saving.']
    ],
    sections: [
      ['What the levels do', 'Photos are limited to 3,000, 2,000 or 1,400 px on the long side and saved at decreasing quality. Balanced suits screen reading and office printing; Strong is for e-mail limits.'],
      ['Why some files hardly change', 'A PDF made only of text, drawings or fonts has nothing to recompress. Pictures stored in CMYK, with special colour profiles or in formats other than JPG are left alone to avoid damaging them. If no smaller file is possible you are told to keep the original.'],
      ['Nothing is turned into a picture', 'Many online compressors save whole pages as images, which makes text unsearchable. Here the text stays text.'],
      ['Other ways to save space', 'Remove unneeded pages, or scan again in greyscale at 150 to 200 dpi.']
    ],
    faq: [
      ['Is the result checked?', 'Yes. The new file is opened and its page count compared before you can download it.'],
      ['Can it reach an exact size?', 'No. Try a stronger level if it is still too large.'],
      ['Does it work with protected PDFs?', 'Unlock them first.'],
      ['Will print quality suffer?', 'With Light hardly at all. Do not send a Strong version to a print shop.']
    ]
  },
  'pdf-to-jpg': {
    lead: 'Save every page of a PDF as a JPG picture, for slides, social posts, messengers or programs that cannot open PDFs.',
    howTo: [
      ['Drop a PDF', 'Rendering starts by itself.'],
      ['Wait for the pages', 'They appear in a list with their pixel size.'],
      ['Download the ones you need', 'Files are named page-1.jpg, page-2.jpg and so on.']
    ],
    sections: [
      ['Resolution', 'Pages are drawn at twice their nominal size, about 144 dpi: an A4 page becomes roughly 1,190 × 1,680 px. That is sharp on screens and fine for small prints, but below the 300 dpi print shops ask for.'],
      ['Text becomes part of the picture', 'It can no longer be selected. Keep the PDF if someone needs to copy from it, or use PDF to Text.'],
      ['Extracting a photo', 'This tool captures whole pages. To get one picture, crop it out of the page with the Image Cropper.'],
      ['Long documents', 'Each page takes memory. Split a long PDF first if your device slows down.']
    ],
    faq: [
      ['Can I choose PNG?', 'Not here. Convert the JPGs afterwards, though they will not become sharper.'],
      ['Can I download all pages at once?', 'Each page has its own button.'],
      ['Why do colours look slightly different?', 'PDFs prepared for print may use CMYK, which screens can only approximate.'],
      ['Does it open protected PDFs?', 'No, unlock the file first.']
    ]
  },
  'jpg-to-pdf': {
    lead: 'Combine JPG photos or scans into one PDF. The pictures are placed in the document without being compressed again, so what you put in is what you get.',
    howTo: [
      ['Add JPG files', 'Only JPG is accepted here.'],
      ['Arrange the pages', 'Arrows move a page; the cross removes it.'],
      ['Choose Fit to image, A4 or Letter', 'Landscape photos get a landscape sheet.'],
      ['Create PDF', 'The file is saved on your device.']
    ],
    sections: [
      ['Phone photos of documents', 'Most phones save JPG, so this is the direct route from photographing a form to sending it. Straighten and crop the pictures first for a tidy result.'],
      ['How large will it be?', 'Add up the sizes of the JPGs and you have the size of the PDF. Twenty phone photos of 4 MB make an 80 MB file, so run them through the Image Compressor beforehand.'],
      ['Printing', 'Choose A4 or Letter. With Fit to image, a 4,000 px photo becomes a page of more than a metre, which printers scale down unpredictably.']
    ],
    faq: [
      ['My iPhone photos are not accepted. Why?', 'They are probably HEIC. Convert them with HEIC to JPG.'],
      ['Can I add PNG as well?', 'Use Image to PDF, which accepts JPG, PNG and WebP together.'],
      ['Is the order by date?', 'It is the order in which you add them.'],
      ['Can I add a password?', 'Yes, afterwards with the PDF Password Protector.']
    ]
  },
  'png-to-pdf': {
    lead: 'Put PNG screenshots, diagrams or exported designs into a PDF without any loss. Every picture becomes a page, in the order you arrange.',
    howTo: [
      ['Add PNG files', 'Only PNG is accepted on this page.'],
      ['Sort them', 'Move pages with the arrows.'],
      ['Choose the page size', 'Fit to image for screens, A4 or Letter for printing.'],
      ['Create PDF', 'Nothing is uploaded.']
    ],
    sections: [
      ['Why PNG is right for screenshots', 'Text and lines stay crisp because neither PNG nor the PDF compresses them with loss. A JPG of the same screen shows smudges around letters.'],
      ['Transparent areas', 'They stay transparent in the PDF and appear white on paper and in normal viewers. Light artwork that was made for a dark background may therefore be hard to see.'],
      ['Documenting a process', 'Number your screenshots 01, 02, 03, select them together and you get a step-by-step document in the right order.']
    ],
    faq: [
      ['Is the picture quality reduced?', 'No.'],
      ['Why is the PDF large?', 'PNG files of photos are large. Convert photos with PNG to JPG first and use JPG to PDF.'],
      ['Can I put several screenshots on one page?', 'Arrange them with the Image Collage tool first.'],
      ['Can I add captions?', 'Not here. Add text to the pictures before converting.']
    ]
  },
  'pdf-password-protect': {
    lead: 'Encrypt a PDF so that it opens only with your password. The tool uses AES-256, and the text inside stays selectable after unlocking.',
    howTo: [
      ['Open the PDF', 'It stays on your device.'],
      ['Type the password twice', 'At least six characters; longer is much better.'],
      ['Press Protect PDF', 'A new file ending in -protected.pdf is saved.'],
      ['Test it', 'Open the copy before you delete or send anything.']
    ],
    sections: [
      ['There is no way back without the password', 'It is not stored anywhere and cannot be reset. Keep the unprotected original in a safe place and note the password in a password manager.'],
      ['Choosing a password', 'Encryption is only as strong as the password. Four random words or 14 mixed characters resist guessing; a birthday or the recipient’s name does not. The Password Generator makes one for you.'],
      ['Sending it safely', 'Send the file and the password by different routes, for example e-mail and a phone call.'],
      ['What protection does not do', 'Whoever knows the password can copy, print and pass the content on.']
    ],
    faq: [
      ['Which programs can open it?', 'Current versions of Acrobat Reader, browsers and common viewers support AES-256. Very old software may not.'],
      ['Can I forbid only printing?', 'No, this tool sets one password for opening the file.'],
      ['It says the PDF is already protected. What now?', 'Remove the old protection with PDF Unlock, then set a new password.'],
      ['Is my password sent anywhere?', 'No.']
    ]
  },
  'pdf-unlock': {
    lead: 'Make a copy of a PDF that opens without a password, or without the restrictions on printing and copying, when you are entitled to do so. You need the password if the file asks for one.',
    howTo: [
      ['Open the protected PDF', 'You are told if there is nothing to unlock.'],
      ['Enter the password if it has one', 'Leave the field empty for files that open freely but restrict printing or copying.'],
      ['Press Unlock PDF', 'The copy is checked and saved with -unlocked in its name.']
    ],
    sections: [
      ['Two kinds of protection', 'An open password stops anyone from reading the file. A permissions password lets everyone read it but asks viewers to block printing or copying. This tool removes the first with your password and the second directly.'],
      ['It does not crack passwords', 'A wrong or missing password is reported. There is no guessing, and strong encryption cannot be bypassed.'],
      ['Text normally stays text', 'The file is decrypted, so searching and links keep working. If an unusual type of encryption cannot be removed, the pages are rebuilt as images and the tool says so.'],
      ['Use it lawfully', 'Unlock your own documents, or others with permission. Bank statements and payslips are a common case: unlock once, then archive them somewhere safe.']
    ],
    faq: [
      ['I forgot my password. Can this help?', 'No. Ask the sender for a new copy.'],
      ['Is the original changed?', 'No, a new file is created.'],
      ['Why did it say nothing to unlock?', 'The PDF has no encryption. Editing limits may come from your viewer.'],
      ['Are signatures kept?', 'A digital signature becomes invalid when the file changes.']
    ]
  },
  'pdf-reader': {
    lead: 'Read a PDF in the browser without installing anything: thumbnails, zoom, page jump and text search, with the file staying on your device.',
    howTo: [
      ['Drop a PDF', 'It opens on the first page.'],
      ['Move around', 'Use the arrows, type a page number or click a thumbnail.'],
      ['Adjust the view', 'Fit width, fit page, actual size, or zoom in steps. Pinch on a touch screen.'],
      ['Search', 'Type in the search box to find text.']
    ],
    sections: [
      ['When a separate reader helps', 'On a borrowed computer, in a browser that downloads PDFs instead of showing them, or when you do not want to open a document in a cloud account.'],
      ['Search works on text only', 'Scanned pages are pictures, so nothing is found in them. Save the page with PDF to JPG and run it through OCR Image to Text.'],
      ['On a phone', 'The thumbnails are hidden to leave room for the page. Fit width and pinch zoom work best.']
    ],
    faq: [
      ['Can I fill in forms or add notes?', 'No, this is a viewer.'],
      ['Can I print?', 'Use your browser or a PDF program for exact printing.'],
      ['Does it open protected files?', 'Not directly. Unlock them first.'],
      ['Is my reading position saved?', 'No. Nothing is stored after you close the page.']
    ]
  },
  /* ── Converters ── */
  'gif-to-webp': {
    lead: 'Convert a GIF picture to a smaller WebP file. Still GIFs, such as old icons and clip art, keep their transparency; from animated GIFs the first frame is saved.',
    howTo: [
      ['Set the quality', '50 to 100%. For flat graphics stay near the top.'],
      ['Drop your GIF files', 'Several at once if you like.'],
      ['Download the WebP files', 'Sizes are shown before and after.']
    ],
    sections: [
      ['Not for animations', 'The result is a still picture. If you need the movement, make the GIF lighter with the GIF Compressor, or turn the source into an MP4 or WebM video, which is far smaller than any GIF.'],
      ['Getting a poster frame', 'A first frame as WebP is useful as a preview image that loads instantly while the animation or video is fetched.'],
      ['Old GIF graphics', 'GIF has 256 colours and hard-edged transparency. WebP has neither limit, but converting cannot invent the missing shades; redraw the picture if you need smooth edges.']
    ],
    faq: [
      ['Can I choose another frame?', 'No, it is always the first one.'],
      ['Is transparency kept?', 'Yes.'],
      ['Can the WebP be larger?', 'For tiny icons with a few colours it can be. Keep the smaller file.'],
      ['Does it work in Safari?', 'Safari cannot create WebP here. The Universal Image Converter can.']
    ]
  },
  'webp-to-gif': {
    lead: 'Turn a WebP picture into a GIF for software that accepts nothing newer, such as old forum systems, e-mail programs and some embroidery or signage tools.',
    howTo: [
      ['Drop a WebP image', 'Other picture formats work too.'],
      ['Wait a moment', 'The colours are reduced and the GIF is written.'],
      ['Download the GIF', 'It keeps the name of your file.']
    ],
    sections: [
      ['256 colours at most', 'Photos lose smoothness: skies show bands and skin looks blotchy. Logos and drawings come out well. If the target also accepts JPG or PNG, use those.'],
      ['One frame', 'The result is a still GIF. An animated WebP contributes its first frame only.'],
      ['Transparency', 'GIF knows only fully visible or fully transparent pixels, and soft edges cannot be represented. For clean cut-outs choose WebP to PNG.'],
      ['Making an animation', 'Convert the frames to PNG and put them together in the GIF Maker.']
    ],
    faq: [
      ['Why is the GIF bigger than the WebP?', 'GIF compression dates from 1987 and is much weaker.'],
      ['Can I convert several files?', 'One at a time.'],
      ['Can I keep the animation?', 'No.'],
      ['Are dimensions changed?', 'No.']
    ]
  },
  'gif-compressor': {
    lead: 'Reduce the size of an animated GIF and keep it moving. Choose a level, or control colours, lossy compression and frame clean-up yourself, and compare the result before you save it.',
    howTo: [
      ['Open a GIF', 'Up to 60 MB. You can also paste one.'],
      ['Read the analysis', 'Frames, dimensions, duration and looping are shown.'],
      ['Choose a level', 'Light, Balanced, Strong or Maximum.'],
      ['Fine-tune if needed', 'Colours from 256 down to 16, lossy strength and frame options.']
    ],
    sections: [
      ['Where the size comes from', 'GIF stores each frame as a picture with up to 256 colours. Long clips, large dimensions, camera movement and film grain all cost space, because little repeats from frame to frame.'],
      ['The most effective settings', 'First let duplicate and similar frames be merged, which costs nothing visible. Then go to 128 or 64 colours. Raise lossy compression last: it adds a fine noise that shows in flat areas.'],
      ['What the tool cannot shorten', 'It does not resize or trim. Cutting the width in half saves more than any other step, so export the animation smaller if you have the source.'],
      ['When to leave GIF', 'For anything longer than a few seconds a short MP4 is often ten times smaller and looks better.']
    ],
    faq: [
      ['Will it still loop?', 'Yes, looping and timing are preserved.'],
      ['Is quality lost?', 'With fewer colours or lossy compression, yes. Compare before saving.'],
      ['Does it work for still GIFs?', 'Yes, though PNG or WebP is usually smaller.'],
      ['Are comments in the file kept?', 'No, metadata is left out.']
    ]
  },
  'image-collage': {
    lead: 'Arrange photos in a neat grid for a mood board, a before-and-after or a family post. Choose the columns, the gap and the background, and save the collage as one PNG.',
    howTo: [
      ['Add your photos', 'They fill the grid from left to right in the order you add them.'],
      ['Set the grid', 'Two, three or four columns, a gap of up to 40 px and small, medium or large tiles.'],
      ['Choose a background', 'It shows in the gaps and empty tiles.'],
      ['Build and download', 'The collage is saved as collage.png.']
    ],
    sections: [
      ['Every tile is square', 'Photos are cropped around their centre to fill the tile. If a head is cut off, crop that photo yourself with the Image Cropper first.'],
      ['Complete rows look best', 'Four photos in two columns or nine in three fill the grid. With seven photos, two tiles show the background.'],
      ['How large is it?', 'Tiles are 160, 220 or 320 px. Three columns of large tiles make a picture about 1,000 px wide: good for screens and messengers, too small for a poster.']
    ],
    faq: [
      ['Can I drag photos to new places?', 'No, the order in which you add them counts.'],
      ['Can I add text?', 'Not here.'],
      ['Can I have tiles of different sizes?', 'No, this is a regular grid.'],
      ['Can I save it as JPG?', 'Convert the PNG with PNG to JPG.']
    ]
  },
  'word-to-pdf': {
    lead: 'Turn a .docx document into a PDF when Word is not at hand. Headings, lists, tables and pictures are read from the file and laid out on A4 or Letter pages.',
    howTo: [
      ['Choose the paper size', 'A4 or Letter.'],
      ['Drop a .docx file', 'Old .doc files need to be saved as .docx first.'],
      ['Press Convert to PDF', 'The PDF is saved automatically.']
    ],
    sections: [
      ['A clean version, not a replica', 'The structure of the document is converted and given a standard layout. Fonts, exact page breaks, headers, footers, columns and text boxes can differ from Word. Read the result before you send it.'],
      ['The pages are images', 'The laid-out document is stored as pictures in the PDF, so the text cannot be searched or selected. For official documents, use Word itself, LibreOffice or Google Docs and export a PDF from there.'],
      ['When it is the right tool', 'Letters, notes, essays and simple reports, particularly on a phone or a borrowed computer, and when you do not want to upload the document.']
    ],
    faq: [
      ['Does it support .doc or .odt?', 'No, only .docx.'],
      ['Are comments and tracked changes included?', 'Do not rely on it. Accept or remove changes before converting.'],
      ['Why does a page break come elsewhere?', 'The text is laid out anew with other fonts and spacing.'],
      ['Is the document uploaded?', 'No, it is read inside your browser.']
    ]
  },
  'markdown-to-html': {
    lead: 'Write or paste Markdown on one side and get a live preview and clean HTML on the other. Copy the code or save it as an .html file.',
    howTo: [
      ['Type or paste Markdown', 'The result changes as you write.'],
      ['Switch between preview and code', 'Two buttons above the output.'],
      ['Copy or download', 'Copy the HTML or save it as a file.']
    ],
    sections: [
      ['What is understood', 'Headings, bold and italic, links, images, lists, quotes, code blocks and tables. HTML inside Markdown is passed through.'],
      ['Preview and code can differ', 'Scripts and event handlers are removed from the preview for your safety, but the HTML code shows everything that was in your text. Check code from others before publishing it.'],
      ['Styling', 'The output contains structure, not design. Your site’s own style sheet decides how it looks, which is why it fits into a blog or a newsletter editor without clean-up.'],
      ['Frequent mistakes', 'A missing space after #, no empty line before a list, and links with spaces in the address are the usual reasons something is not formatted.']
    ],
    faq: [
      ['Does it include a full HTML page?', 'You get the content. Put it inside the body of your page.'],
      ['Is syntax highlighting included?', 'Code is marked up, colours are up to your site.'],
      ['Are line breaks kept?', 'A single line break joins the text. Leave an empty line for a new paragraph.'],
      ['Can I go from HTML to Markdown?', 'No, one direction only.']
    ]
  },
  /* ── Marketing ── */
  'social-image-resizer': {
    lead: 'Fit one picture to the sizes social networks expect. Twelve presets cover posts, stories, covers and thumbnails, and you can drag the picture to choose what stays visible.',
    howTo: [
      ['Choose a preset', 'Instagram, Facebook, X, LinkedIn, YouTube, WhatsApp or Pinterest.'],
      ['Load your image', 'Any format your browser shows.'],
      ['Choose a mode', 'Fill & crop, Fit with white bars, or Stretch.'],
      ['Drag and download', 'Move the picture in Fill mode and save a PNG at the exact size.']
    ],
    sections: [
      ['The presets', 'Instagram post 1080 × 1080, portrait 1080 × 1350 and story 1080 × 1920; Facebook post 1200 × 630 and cover 820 × 312; X post 1200 × 675 and header 1500 × 500; LinkedIn post 1200 × 628 and banner 1584 × 396; YouTube thumbnail 1280 × 720; WhatsApp profile 800 × 800; Pinterest pin 1000 × 1500.'],
      ['Keep the middle free', 'Profile pictures and buttons cover parts of covers and stories. Keep faces and text away from the edges, and in stories leave about 250 px empty at the top and bottom.'],
      ['One picture, several sizes', 'Start with a large photo that has space around the subject. A tight portrait cannot become a wide banner without cutting the head.']
    ],
    faq: [
      ['Is a small picture enlarged?', 'Yes, it is scaled up to the preset and may look soft. Use a source at least as large.'],
      ['Can I use a background colour other than white?', 'Not here. Fill the picture instead or prepare the background first.'],
      ['Can I make all sizes at once?', 'One preset at a time; the picture stays loaded.'],
      ['Is PNG accepted everywhere?', 'Yes by these networks, which compress uploads themselves.']
    ]
  },
  'color-palette-gen': {
    lead: 'Find colours that belong together. Take them from a photo you like, or start from one colour and get complementary, triadic, analogous and other schemes to copy.',
    howTo: [
      ['Choose a starting point', 'An image or a base colour.'],
      ['Load the image or pick the colour', 'A palette appears at once.'],
      ['Copy what you need', 'Click a swatch to copy its HEX code.']
    ],
    sections: [
      ['From a photo', 'The most frequent colours are collected and near-duplicates skipped. Photos with one clear mood give better palettes than busy ones; crop to the part you like first.'],
      ['From one colour', 'Complementary colours face each other on the colour wheel and create contrast. Analogous ones sit side by side and feel calm. Triads are lively and need one colour to lead.'],
      ['Using a palette', 'A simple rule is 60% neutral or background, 30% main colour, 10% accent. Keep the accent for buttons and links.'],
      ['Check the contrast', 'Harmony says nothing about legibility. Body text needs a contrast ratio of at least 4.5 to 1 against its background.']
    ],
    faq: [
      ['Is this the same as the Brand Color Extractor?', 'That one looks for the defining colours of a logo and ignores its background. This one collects the common colours of a picture and builds schemes.'],
      ['Which formats can I copy?', 'HEX. The Color Code Converter gives you RGB and HSL.'],
      ['Are colours exact?', 'Image colours are grouped, so they can differ slightly from a single pixel. Use the Color Picker for that.'],
      ['Are palettes saved?', 'No, copy the ones you want to keep.']
    ]
  },
  'cta-button-gen': {
    lead: 'Design a call-to-action button, see it live and take the CSS with you. Adjust text, size, colours, corners and padding, or save the button as a picture for a newsletter.',
    howTo: [
      ['Write the text', 'Two to four words that say what happens next.'],
      ['Adjust the look', 'Font size, colours, border radius and horizontal padding.'],
      ['Copy CSS or download', 'Paste the class into your style sheet, or save a PNG.']
    ],
    sections: [
      ['Wording that works', 'Start with a verb and name the result: “Download the checklist” beats “Submit”. Avoid two equally loud buttons next to each other.'],
      ['Contrast and size', 'Text on the button should have a contrast of at least 4.5 to 1. On phones a button should be at least 44 px high; 16 px text with the generated padding comes close, so add a little vertical padding if necessary.'],
      ['Finish it in your CSS', 'The code covers the normal state. Add a slightly darker colour for hover and a visible outline for keyboard focus.'],
      ['PNG buttons in e-mail', 'Pictures are often blocked. Give the image an alt text and link it, or use a styled link instead.']
    ],
    faq: [
      ['Does it create the link too?', 'No, it creates the look. Apply the class to a link or a button.'],
      ['Can I use a gradient?', 'Make one in the CSS Gradient Generator and replace the background line.'],
      ['Which font is used?', 'The font of your own site.'],
      ['Can I add an icon?', 'An emoji in the text works; other icons need your own HTML.']
    ]
  },
  'utm-builder': {
    lead: 'Tag links so your analytics show which newsletter, post or advert brought each visitor. Build a clean UTM address, or paste an existing one to see what is in it.',
    howTo: [
      ['Enter the page address', 'https is added if you leave it out.'],
      ['Fill in source, medium and campaign', 'Term and content are optional.'],
      ['Build and copy', 'The tool warns you about missing or invalid parts.'],
      ['Or decode', 'Paste a tagged link to list its parameters.']
    ],
    sections: [
      ['What the fields mean', 'Source is where the link stands (newsletter, linkedin). Medium is the kind of traffic (email, social, cpc). Campaign is the action (spring_sale). Content tells two links in one message apart, term holds a paid keyword.'],
      ['Agree on spelling', 'Analytics treats Email, email and e-mail as three media. Use lower case, underscores instead of spaces, and keep a list your whole team uses.'],
      ['Never tag internal links', 'A UTM link from one page of your site to another starts a new session and overwrites where the visitor really came from.'],
      ['Links with # or ?', 'Parameters are placed before any # part and added correctly to addresses that already contain a question mark.']
    ],
    faq: [
      ['Do UTM links hurt SEO?', 'Not if your pages have a canonical link, which tells search engines which address counts.'],
      ['Where do I see the results?', 'In Google Analytics 4 under Reports, Acquisition, Traffic acquisition.'],
      ['Can visitors see the tags?', 'Yes, they are part of the address, so do not put personal data in them.'],
      ['Should I shorten the link?', 'For print and social posts it looks better. The parameters survive the redirect.']
    ]
  },
  'og-image-gen': {
    lead: 'Create the preview picture that appears when a page is shared. Enter a title, a subtitle and your brand, choose three colours and download a 1200 × 630 px PNG.',
    howTo: [
      ['Write the title', 'It wraps over several lines in the preview.'],
      ['Add subtitle and logo text', 'For example your domain and brand name.'],
      ['Choose the colours', 'Background, accent and text.'],
      ['Download and upload', 'Place the file on your site and link it in the og:image tag.']
    ],
    sections: [
      ['Make it readable when small', 'In a feed the picture may be only 300 px wide. Five to eight words and strong contrast work; a whole sentence does not.'],
      ['Adding it to a page', 'Use a full address: <meta property="og:image" content="https://example.com/preview.png">. The Meta Tag Generator writes this together with the other tags.'],
      ['Why the old picture still appears', 'Networks store previews. Use Facebook’s Sharing Debugger or LinkedIn’s Post Inspector to refresh them, or change the file name.'],
      ['Alt text', 'Add og:image:alt with a short description so people using screen readers know what is shown.']
    ],
    faq: [
      ['Can I upload a photo or logo file?', 'No, the design is made of text and colours.'],
      ['Does one size fit every network?', '1200 × 630 px is accepted by Facebook, LinkedIn, X, WhatsApp, Slack and others.'],
      ['Do I need a different picture for every page?', 'It helps. At least give your most shared pages their own.'],
      ['Is the PNG too heavy?', 'Flat designs are small. If needed, convert to JPG.']
    ]
  },
  'pdf-lead-magnet': {
    lead: 'Turn a list of tips, steps or resources into a simple branded PDF you can offer in return for a newsletter sign-up. Type one item per line and choose a layout.',
    howTo: [
      ['Choose a template', 'Checklist, step-by-step guide, cheatsheet or resource list.'],
      ['Enter title, brand and colour', 'They form the header and footer.'],
      ['Write one item per line', 'New pages are added when the list is long.'],
      ['Generate the PDF', 'It is named after your title.']
    ],
    sections: [
      ['Short and useful wins', 'A one-page checklist that saves somebody an hour is worth more than a 30-page e-book nobody opens. Solve one concrete problem and name it in the title.'],
      ['Keep items short', 'Long items wrap onto further lines, but a checklist is easiest to use when each point fits on one, about 80 characters.'],
      ['Letters the PDF knows', 'The built-in font covers Western European languages. If your text contains other scripts or emoji, the tool names the character instead of making a broken file.'],
      ['Delivering it', 'Link the file in the welcome e-mail instead of the thank-you page, so that the address has to be real.']
    ],
    faq: [
      ['Can I add my logo?', 'Only your brand name as text.'],
      ['Is there any branding from this site?', 'No. The footer shows only your brand and the page number.'],
      ['Which page size is used?', 'A4.'],
      ['Can I edit the PDF later?', 'Change the text here and generate it again.']
    ]
  },
  'brand-color-extract': {
    lead: 'Read the colours of a logo and get them as HEX, RGB and HSL, plus CSS variables for your project. White, grey and black backdrops are left out so the brand colours come first.',
    howTo: [
      ['Upload the logo', 'A large PNG with a transparent background is ideal.'],
      ['Look at the swatches', 'Up to six colours, the most used first.'],
      ['Copy', 'Click a swatch, copy the CSS variables or save the palette as PNG.']
    ],
    sections: [
      ['How colours are chosen', 'The picture is searched for clearly different colours that cover a visible area. The blended pixels along edges are ignored, and each result is a colour that really occurs in the file where possible.'],
      ['The source matters', 'A JPG screenshot of a logo contains compression noise and slightly wrong shades. Ask for the original file, or look the values up in the brand guide, which always overrides a measurement.'],
      ['Using the CSS variables', 'Paste the block into your style sheet and write var(--brand-primary) wherever the colour is needed. Changing the brand then means changing one line.'],
      ['Other people’s brands', 'Colours can be part of a trademark. Use competitors’ palettes for comparison, not as your own identity.']
    ],
    faq: [
      ['Why is black or grey missing?', 'Neutral backdrops are skipped. Neutral colours inside the logo are listed after the others.'],
      ['Does it work with photos?', 'It does, but the Color Palette Generator is made for that.'],
      ['Can I get Pantone or CMYK values?', 'No. They depend on ink and paper and need a colour library.'],
      ['Can I upload an SVG?', 'If your browser displays it as an image, yes.']
    ]
  },
  'hashtag-gen': {
    lead: 'Get a shuffled set of established hashtags for design, marketing, photography, business or technology posts and copy them in one click.',
    howTo: [
      ['Choose a category', 'Five are available.'],
      ['Say how many you want', 'Each category holds up to 30.'],
      ['Generate and copy', 'Press again for a different selection.']
    ],
    sections: [
      ['A starting set, not live data', 'The lists are fixed and do not measure current popularity. Look a tag up in the app before you use it, to see whether the posts match yours and whether it is still active.'],
      ['Mix large and small tags', 'Broad tags such as #Photography bury a new post within seconds. Add two or three specific ones, such as your city, your technique or your niche, where you can stay visible.'],
      ['How many?', 'Instagram allows 30 but suggests three to five; LinkedIn posts work well with three; on X one or two are enough. Relevance matters more than number.'],
      ['Accessibility', 'Capitalise each word, as in #WebDesign, so that screen readers pronounce it correctly.']
    ],
    faq: [
      ['Can I enter my own topic?', 'No, choose one of the five categories.'],
      ['How many tags does a category have?', '30. If you ask for more, you get all 30.'],
      ['Are banned hashtags filtered?', 'The lists contain common professional tags, but platforms change their rules. Check if a post gets unusually little reach.'],
      ['Caption or first comment?', 'Both work on Instagram. Choose whichever you find tidier.']
    ]
  },
  /* ── Developer ── */
  'password-generator': {
    lead: 'Generate random passwords of 8 to 64 characters with the browser’s cryptographic random source. Nothing is sent or stored, and the strength is shown in bits.',
    howTo: [
      ['Choose the length', '16 is the default; use 20 or more for important accounts.'],
      ['Choose the characters', 'Upper case, numbers and symbols can be switched off if a site forbids them.'],
      ['Generate and copy', 'Every selected kind of character is guaranteed to appear.']
    ],
    sections: [
      ['Why the randomness matters', 'Characters are drawn without bias from the operating system’s secure generator, the same source used for encryption keys. People cannot do this in their heads: invented passwords follow patterns that attackers try first.'],
      ['Reading the strength', 'Each bit doubles the number of attempts needed. Below 50 bits is weak, 75 to 110 is strong, above that very strong. Sixteen characters with all types give a little over 100 bits.'],
      ['Length beats symbols', 'If a site refuses symbols, add three characters instead.'],
      ['Where to keep them', 'Use a password manager with one long passphrase you can remember, and turn on two-factor sign-in. Never use the same password twice.']
    ],
    faq: [
      ['Can you see my password?', 'No. It is created in your browser and disappears with the page.'],
      ['Is it safe on a shared computer?', 'Close the page afterwards and clear the clipboard, for example by copying another text.'],
      ['Why does a site reject it?', 'Some limit the length or certain symbols. Switch symbols off and make it longer.'],
      ['How often should I change passwords?', 'When there is reason to suspect a leak. Routine changes lead to weaker ones.']
    ]
  },
  'css-gradient-gen': {
    lead: 'Build linear, radial or conic CSS gradients with as many colours as you like, see them at once and copy the code, with prefixes for old browsers where they are needed.',
    howTo: [
      ['Choose the type', 'Linear and conic gradients have an angle.'],
      ['Set the colours', 'Each has a position from 0 to 100%. Add or remove as many as you need.'],
      ['Repeat if you want stripes', 'Tick Repeat to continue the pattern.'],
      ['Copy CSS', 'Paste it into your style sheet.']
    ],
    sections: [
      ['Avoiding the grey middle', 'Blue to yellow or red to green passes through a muddy grey. Put a third colour between them, such as violet or orange, and the transition stays vivid.'],
      ['Hard edges and stripes', 'Give two colours the same position to get a sharp line. Together with Repeat this makes stripes without an image.'],
      ['Conic gradients', 'They turn around the centre and are the simplest way to draw pie charts, colour wheels and loading rings.'],
      ['Text on gradients', 'Check the contrast at both ends. A semi-transparent dark layer behind the text is a simple remedy.']
    ],
    faq: [
      ['Is a gradient faster than an image?', 'Yes. It needs no download and stays sharp at any size.'],
      ['Do I need the -webkit- line?', 'Only for very old browsers. You can delete it.'],
      ['Can I use transparency?', 'The colour fields are opaque. Add alpha to the codes after copying.'],
      ['Why does my gradient show bands?', 'Very subtle transitions over large areas can band on some screens. Increase the colour difference.']
    ]
  },
  'base64-encoder': {
    lead: 'Convert text to Base64 and back, including accents, emoji and other scripts. URL-safe output, missing padding and data addresses are handled, and errors are explained.',
    howTo: [
      ['Choose Encode or Decode', 'Swap moves the result back into the input.'],
      ['Paste your text', 'Line breaks in Base64 do not matter.'],
      ['Convert and copy', 'Tick URL-safe for use in links and tokens.']
    ],
    sections: [
      ['What Base64 is for', 'It writes any data with 64 harmless characters so that it survives systems made for text: e-mail attachments, JSON fields, HTTP headers and images embedded in CSS. The result is about a third longer.'],
      ['It is not encryption', 'Anyone can decode it in a second. Never hide passwords or keys with it.'],
      ['The URL-safe variant', 'Plus and slash have a meaning in addresses, so they are replaced by minus and underscore and the equals signs are dropped. JSON Web Tokens use this form; decode the part before the first dot to see the header.'],
      ['When decoding fails', 'You are told about an invalid character or a cut-off string. If the content is valid but not text, it is probably a picture or a compressed file.']
    ],
    faq: [
      ['Which text encoding is used?', 'UTF-8.'],
      ['Can I encode a file?', 'This tool handles text only.'],
      ['What do the equals signs mean?', 'They fill the last group of four characters. They carry no data.'],
      ['Why does another tool give a different result?', 'It may use another text encoding or add line breaks.']
    ]
  },
  'json-formatter': {
    lead: 'Check, indent or minify JSON without changing a single value. Long numbers and escaped characters stay exactly as they were, which many formatters get wrong.',
    howTo: [
      ['Paste your JSON', 'It is checked while you type.'],
      ['Format or Minify', 'Indent it for reading or remove all spaces for sending.'],
      ['Copy', 'The result replaces the text in the box.']
    ],
    sections: [
      ['Why exact numbers matter', 'JavaScript keeps about 16 digits. A formatter that reads and rewrites the data turns the ID 12345678901234567890 into 12345678901234567000. Here the original characters are kept and only the white space changes.'],
      ['The usual errors', 'A comma after the last item, single quotes instead of double ones, keys without quotes, comments, and NaN or undefined are all invalid in JSON, even though JavaScript accepts them.'],
      ['Reading error messages', 'The position counts characters from the start. The real mistake is often just before it, for instance a missing comma in the previous line.'],
      ['Private data', 'API answers often contain tokens and customer data. Nothing you paste leaves the page.']
    ],
    faq: [
      ['Does it sort keys?', 'No, the order is preserved.'],
      ['Can it repair broken JSON?', 'No, it shows where the problem is.'],
      ['Is there a size limit?', 'No fixed limit; several megabytes may take a moment.'],
      ['Are duplicate keys reported?', 'No. They are technically allowed, but most programs keep only the last one.']
    ]
  },
  'meta-tag-gen': {
    lead: 'Write the title, description, canonical, Open Graph and X Card tags of a page in one go. Character counters help with length and special characters are escaped correctly.',
    howTo: [
      ['Enter title and description', 'The counters show the length.'],
      ['Add page and image address', 'Both are optional but recommended.'],
      ['Generate', 'Tags for missing fields are left out instead of being empty.'],
      ['Copy into the head', 'Replace existing tags rather than adding a second set.']
    ],
    sections: [
      ['Titles', 'Put the topic first and the brand last, and keep it under about 60 characters. Every page needs its own; Google rewrites titles that are repeated or stuffed with keywords.'],
      ['Descriptions', 'They do not raise the ranking, but they persuade people to click. Say what the page offers in 120 to 160 characters.'],
      ['Canonical', 'It names the preferred address when the same page can be reached in several ways, for example with tracking parameters. Use the full address with https.'],
      ['Open Graph', 'These tags control the preview on social networks and in chats. The picture should be 1200 × 630 px; the Open Graph Image Generator makes one.']
    ],
    faq: [
      ['Do I need the keywords tag?', 'No. Google has ignored it for many years.'],
      ['Why does Google show another description?', 'It often quotes a passage that fits the search better.'],
      ['Where do I paste the tags in WordPress?', 'Use the fields of your SEO plugin instead, which create the same tags.'],
      ['How do I test the preview?', 'With Facebook’s Sharing Debugger or LinkedIn’s Post Inspector.']
    ]
  },
  'color-converter': {
    lead: 'Type a colour in any CSS notation and get it as HEX, RGB, HSL, HSB and a CSS variable. Names such as tomato, short HEX codes and transparent colours are understood.',
    howTo: [
      ['Enter a colour', 'For example #6366f1, rgb(99 102 241), hsl(239 84% 67%) or tomato. Or use the picker.'],
      ['Read all formats', 'They update together.'],
      ['Click to copy', 'Each line copies its value.']
    ],
    sections: [
      ['Which notation when', 'HEX is compact and works everywhere. RGB is handy in scripts. HSL is the easiest to adjust by hand: change the lightness for hover states, the saturation for calmer versions. HSB, also called HSV, is what design programs show in their pickers.'],
      ['HSL and HSB are not the same', 'Both start with hue, but 50% lightness in HSL is the full colour, while in HSB the full colour has 100% brightness. Mixing them up gives wrong shades.'],
      ['Transparency', 'With an alpha value you get RGBA, HSLA and eight-digit HEX, where the last two digits are the opacity: 80 is about 50%.'],
      ['Rounding', 'HSL and HSB are shown in whole numbers, so converting back can differ by one step. Keep HEX or RGB as your reference.']
    ],
    faq: [
      ['Can it convert to CMYK?', 'No. That needs a profile of the printer and paper.'],
      ['Does it understand oklch?', 'If your browser does, the colour may be accepted, though values outside the normal range cannot be shown exactly.'],
      ['Is #fff the same as #ffffff?', 'Yes.'],
      ['How do I check contrast?', 'Use a contrast checker with the HEX values; this tool only converts.']
    ]
  },
  'url-encoder': {
    lead: 'Encode text for use in a web address, or read an encoded one. Choose between a single value and a complete link, and get a clear message when something cannot be decoded.',
    howTo: [
      ['Choose Encode or Decode', 'The options change accordingly.'],
      ['Paste your text', 'Tick Full URL if it is a whole link.'],
      ['Convert and copy', 'For form data, tick the plus option when decoding.']
    ],
    sections: [
      ['One value or a whole link?', 'A value that goes after an equals sign must have every special character encoded, including / and &. In a whole link those characters have a job and must stay. Encoding a whole link as a value breaks it.'],
      ['Spaces: %20 or +', 'In a path a space is %20. In data sent by web forms it may be a plus sign. That is why a decoded search term can show plus signs unless you tick the option.'],
      ['Double encoding', 'If you see %2520, a value has been encoded twice: %25 is the percent sign itself. Decode it twice and fix the code that did it.'],
      ['International characters', 'Letters outside English are written as UTF-8 bytes: é becomes %C3%A9.']
    ],
    faq: [
      ['Which characters never need encoding?', 'Letters, digits and - _ . ~'],
      ['Why can’t my text be decoded?', 'A percent sign must be followed by two hexadecimal digits. The position of the first bad one is shown.'],
      ['Is it the same as Base64?', 'No. Base64 rewrites everything, URL encoding only the characters that are unsafe.'],
      ['Can I encode several lines?', 'Yes. Line breaks become %0A.']
    ]
  },
  'text-diff': {
    lead: 'Paste two versions of a text and see what was added and removed, down to single words. Lines that moved little are matched, so one inserted paragraph does not mark everything after it.',
    howTo: [
      ['Paste the original', 'On the left.'],
      ['Paste the changed text', 'On the right.'],
      ['Press Compare', 'Additions are green, removals red and struck through, with a count above.']
    ],
    sections: [
      ['Lines first, then words', 'Unchanged lines are found with the same method used by version control systems. Lines that changed are then compared word by word, so you see the edit and not just the line.'],
      ['Reading the numbers', 'A changed line counts as one removed and one added. Word counts show how large the edit really was.'],
      ['White space counts', 'Different indentation or a trailing space is a difference. If everything seems changed, one version may use other line endings or tabs: paste both into a plain editor first.'],
      ['Good uses', 'Checking a contract that came back from the other side, comparing configuration files, or finding what an editor did to your article.']
    ],
    faq: [
      ['Can I compare Word or PDF files?', 'Copy the text into the boxes. PDF to Text helps with PDFs.'],
      ['Is upper and lower case significant?', 'Yes.'],
      ['Can I save the comparison?', 'Not as a file. Take a screenshot or print the page.'],
      ['Are confidential texts safe?', 'They are compared in your browser and not sent anywhere.']
    ]
  },
  'regex-tester': {
    lead: 'Try a regular expression on your own text and watch the matches light up as you type. Capture groups, including named ones, are listed, and broken patterns are explained.',
    howTo: [
      ['Type a pattern', 'Without the slashes.'],
      ['Set the flags', 'g for all matches, i to ignore case, m for line starts and ends.'],
      ['Paste test text', 'Matches and groups update live.']
    ],
    sections: [
      ['JavaScript flavour', 'Patterns run in your browser’s engine. Most syntax is the same in Python, PHP or Java, but lookbehind, named groups and Unicode classes are written or supported differently in some of them.'],
      ['Frequent mistakes', 'An unescaped dot matches any character, so write \\. for a real one. A greedy .* takes as much as it can; .*? stops at the first chance. ^ and $ mean the whole text unless m is on.'],
      ['Slow patterns', 'Nested repetition such as (a+)+ can take extremely long on certain text and freeze the page. Avoid repeating something that is itself repeated.'],
      ['Test what should not match', 'A pattern that finds all valid entries may also accept wrong ones. Put counter-examples in the text as well.']
    ],
    faq: [
      ['Can it replace text?', 'No, it finds matches.'],
      ['Why are only the first groups shown?', 'Groups are listed for the first match to keep the view readable.'],
      ['How many matches are shown?', 'Up to 5,000.'],
      ['Can I check e-mail addresses with a regex?', 'Only roughly. Sending a confirmation message is the reliable test.']
    ]
  },
  'slug-generator': {
    lead: 'Turn a headline into a clean address ending: lower case, hyphens or underscores, no special characters. Accents are simplified, and Cyrillic and Greek letters are transcribed.',
    howTo: [
      ['Type or paste a title', 'The slug appears as you type.'],
      ['Choose the separator', 'Hyphens for web pages, underscores for file names.'],
      ['Copy', 'The length is shown next to it.']
    ],
    sections: [
      ['What makes a good slug', 'Three to six meaningful words. Leave out filler such as “the” or “how to” if the meaning survives, and leave out years and numbers that will change.'],
      ['Hyphens or underscores?', 'Google recommends hyphens, because it reads them as spaces between words.'],
      ['Languages', 'Ü becomes u, ß becomes ss, ø becomes o, and Cyrillic and Greek are written in Latin letters. Characters that cannot be converted, such as Chinese or Hindi, are left out and you are told; use an English version of the title.'],
      ['Changing a slug later', 'Every old link breaks unless you add a permanent (301) redirect from the old address to the new one.']
    ],
    faq: [
      ['Is there a maximum length?', 'Technically a very long one. Under 60 characters is practical.'],
      ['Are stop words removed?', 'No, you decide what to shorten.'],
      ['Why lower case?', 'Some servers treat Page and page as two addresses.'],
      ['Does the slug affect ranking?', 'Slightly. Its main value is that people understand the link.']
    ]
  },
  'text-case-converter': {
    lead: 'Change the case of a text with one click: upper, lower, title and sentence case for writing, and camelCase, PascalCase, snake_case and kebab-case for code.',
    howTo: [
      ['Paste your text', 'Several lines are fine.'],
      ['Press a style', 'The result appears below.'],
      ['Copy, or use it as input', 'Chain two conversions with Use as input.']
    ],
    sections: [
      ['Title case and small words', 'Words such as a, the, and, of, in and to stay lower case unless they begin a title or sentence, close to what most English style guides ask. Other languages capitalise titles differently, so use sentence case there.'],
      ['Code styles', 'camelCase is common for JavaScript variables, PascalCase for classes, snake_case for Python and databases, kebab-case for CSS and addresses. Existing camelCase and abbreviations are split sensibly: parseHTTPResponse becomes parse_http_response.'],
      ['Names need a second look', 'No program knows that McDonald, iPhone or van Gogh have their own spelling. Check proper names after converting.'],
      ['All capitals', 'Long passages in capitals are tiring to read and screen readers may spell them out. Prefer bold or a heading.']
    ],
    faq: [
      ['Does it work with accents and other alphabets?', 'Yes, wherever the script has upper and lower case.'],
      ['Are apostrophes kept?', 'In normal text yes; in code styles they are dropped.'],
      ['Is each line treated separately?', 'In the code styles yes, which is useful for lists of names.'],
      ['Can I undo it?', 'The original stays in the upper box until you replace it.']
    ]
  },
  'timestamp-converter': {
    lead: 'Translate Unix timestamps into dates and back. Seconds, milliseconds, microseconds and nanoseconds are recognised automatically, and you see local time, UTC and ISO 8601 together.',
    howTo: [
      ['Paste a timestamp', 'The unit is detected from its size.'],
      ['Read the date', 'Local time with your time zone, UTC and ISO.'],
      ['Or choose a date', 'Say whether it is UTC or your local time and get seconds and milliseconds.']
    ],
    sections: [
      ['What the number means', 'Seconds since midnight UTC on 1 January 1970. Ten digits are seconds and thirteen milliseconds for today’s dates; the tool tells you how it read your number.'],
      ['Time zones', 'A timestamp has no time zone, it names one moment everywhere. Differences appear only when it is displayed. If a result is off by whole hours, a local time was treated as UTC or the other way round.'],
      ['The year 2038', 'Systems that store seconds in a signed 32-bit number overflow on 19 January 2038. Use 64-bit values in new databases.'],
      ['In code', 'JavaScript’s Date.now() gives milliseconds, Python’s time.time() and PHP’s time() give seconds. Forgetting the factor of 1,000 leads to dates in 1970 or far in the future.']
    ],
    faq: [
      ['Can timestamps be negative?', 'Yes, for dates before 1970.'],
      ['Are leap seconds counted?', 'No, Unix time ignores them.'],
      ['Which format should I store?', 'A timestamp or ISO 8601 in UTC. Convert to local time only for display.'],
      ['Is daylight saving time considered?', 'Yes, for your own time zone at the date in question.']
    ]
  }
};
