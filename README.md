# Julia Set Explorer

This project allows for the exploration of Julia sets in real time.
If you are in need of a screensaver look no further, there are plenty to find here.

Try it yourself: [click me](https://syn-ce.github.io/JuliaSetExplorer/)

Or skip ahead to the [Gallery](#gallery)

This is still **very much a work in progress** and there's a lot left to do, but most of the initially planned features have already been implemented. There are still a couple of bugs in need of fixing as well as a lot of yet-to-be-made considerations for the overall UX, escpecially considering information about what the individual settings and parameters do. If you find yourself struggling to figure out what something does or what it's used for, I have made an effort to lay out most explanations in this README, so you'll probably find a [section](#table-of-contents) dedicated to it.
On the developer's side some things have gotten a bit messy over time so there's a lot of room for cleaning. I plan on tidying everything up once I find the time to do so.
Notice that for the time being there is **no support for mobile devices**.

# Table of contents

[What am I even looking at? - Mandelbrot and Julia](#mandelbrot-and-julia) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[The Mandelbrot set](#the-mandelbrot-set) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Julia sets](#julia-sets) <br>
[Usage](#usage) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[General](#general) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Shortcuts / Settings](#shortcuts--settings) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Saving Images](#saving-images) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Filenames](#filenames) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Pasting Images](#pasting-images) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Loading random Julia sets](#loading-random-julia-sets) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Random](#loading-random-julia-sets) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Selected](#loading-random-julia-sets) <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Community](#loading-random-julia-sets) <br>
[Parameters](#parameters) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Julia Coordinates (c value of the Julia set)](#julia-coordinates-c-value-of-the-julia-set) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Escape Radius](#escape-radius) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Exponent](#exponent) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Number of Iterations](#number-of-iterations) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Color](#color) <br>
[Double precision using CPU Rendering](#double-precision-using-cpu-rendering) <br>
&nbsp;&nbsp;&nbsp;&nbsp;[Avoiding pixelation with CPU rendering](#avoiding-pixelation-with-cpu-rendering) <br>
[Gallery](#gallery) <br>

## Mandelbrot and Julia

### The Mandelbrot set

If you are already familiar with the Mandelbrot set, you may skip this section and jump ahead to the [next one](#julia-sets).

At the basis of this entire project lies one uncomplicated formula: $$z_{n+1}=z_n^2+c$$
where both $z$ and $c$ are complex numbers.
The Mandelbrot set consists of all complex points $c=x+iy$ for which the above sequence starting with $z_0=0$ does not diverge to infinity for $n\rightarrow\infty$.
All of the points contained in the Mandelbrot set are colored black. The coloring of the other points follows some arbitrary coloring function, usually based on the "time" it takes the series to "diverge to infinity" based on the particular point $c$.

### Julia sets

Julia sets are defined using the same sequence of complex numbers as the Mandelbrot set:
$$z_{n+1}=z_n²+c$$
The only difference is that instead of asking for which $c$ the series diverges to infinity starting at $z_0=0$, we instead fixate the $c$ and ask for which starting points $z_0=x+iy$ the series diverges to infinity.

# Usage

## General

Both the Mandelbrot set on the left and the Julia set on the right will be rendered using the parameters configured by you.

You can interact with them by panning and zooming. The dot rendered on top of the Mandelbrot set is the indicator for the coordinates of the current $c$ value used for rendering the Julia set. By default, that point will follow your mouse when hovering over the Mandelbrot set. This behavior can be (de-)activated by pressing the "f" key on your keyboard. You can also adjust the current $c$ value by directly entering values into the corresponding inputs.

![](/imgs/usagePictures/usagePicture.jpg)

### Shortcuts / Settings

| Key | Action                                            |
| :-: | ------------------------------------------------- |
|  f  | start/stop the $c$ value from following the mouse |
|  s  | open/close preview for saving image               |
|  i  | open/close info-modal                             |
|  h  | hide/show user interface                          |
|  r  | start/stop random movement of $c$ value           |
|  t  | generate random Julia set                         |
|     | send and load Julia sets (community)              |

In case you ever need a refresher on the shortcuts or want to enable/disable any of the options simply click the question mark in the lower right corner of the screen or press the "i" key on your keyboard. This will open a modal listing all available keyboard-shortcuts.

## Saving Images

All generated Julia sets can be downloaded in PNG-format in arbitrary resolution (in practice, your browser probably won't like allocating a gigabyte of memory for a single tab so maybe don't go beyond the limits).

In order to save an image, click on the corresponding button or press the "s"-key on your keyboard. This will open a preview in which you can adjust the center of the image, the zoom, the resolution, and turn on [CPU rendering](#avoiding-pixelation-with-cpu-rendering). You can center any point of the Julia set in the preview by double-clicking it.

Once you are satisfied with how things are looking, start rendering the final image by pressing the associated button. Once the image has been rendered, it will be downloaded.

When saving an image the corresponding parameters will by default be sent to a server to share with others (see [Community](#community) for more information).

If you are making use of CPU rendering this will take some time. A progress bar and an estimate of the remaining time will act as indicators.
If you don't use CPU rendering (which is advised if it's not necessary) the render should, under most circumstances, finish after no longer than a couple of seconds at most and usually be perceived as instantaneous.

By default the resolution should be set to match the resolution of your monitor. If that's not the case or you would like to change the resolution of the downloaded image for some other reason, you can do so by entering the values into the corresponding inputs. The preview will automatically try to adjust to display the correct aspect ratio. If the preview gets too small, it will try to resize itself to take up more space. However, it will only try to do so when the preview can fit on the screen. If the aspect ratio is very out of the ordinary (i.e. something like 50:1) it is very likely that the preview will extend beyond the bounds of the screen and not adjust its size.

Note that changing the resolution will not affect the quality of the image in the preview, meaning that there will be no visual difference between the preview of an image with resolution 3072x1920 (aspect ratio 16:10) and that of an image with a resolution of 1920x1200 (16:10 as well). The resulting image will of course be rendered in the desired resolution.

![example screenshot of the editor for / preview of the image to download](/imgs/controlsUI/downloadEditorAndPreview.jpg)

```
JuliaSet_183_34_185_300_2_100_-1.0174876847290641_0.3214285714285714_0_0_1.7490062499999994_SC_LC_0.png
```

## Filenames

All downloaded Julia sets will have a filename in a very particular format:

```
JuliaSet_RGB.R_RGB.G_RGB.B_NrIterations_Exponent_EscapeRadius_JuliaCoordX_JuliaCoordY_DownloadCenterX_DownloadCenterY_ZoomLevel_[COLOR-SETTINGS]_CPURendering.png
```

where

-   `JuliaCoordX` and `JuliaCoordY` represent the $c$-value of the Julia set ($c=x+iy$)
-   `DownloadCenterX` and `DownloadCenterY` represent the coordinates of the center of the Julia image
-   `[COLOR-SETTINGS]` is an underscore-separated list containing any combination of the following color-options: `SC, SO, LC, NL1, NL2` representing Smooth Coloring, Static Orange, Linear RGB, Nonlinear 1 and Nonlinear 2.
-   `CPURendering` is either of value 0 (CPU rendering off) or 1 (CPU rendering on). Note that because of performance reasons this is the only value which will always be set to 0 when [pasting Julia sets](#pasting-images), no matter the actual value in the filename. For more information, see [CPU rendering](#avoiding-pixelation-with-cpu-rendering)

For more information refer to the [Parameters](#parameters)-section below.

## Pasting Images

All downloaded Julia sets can be pasted into the browser to immediately restore the state from when the image was downloaded. This is especially useful when the Julia set needs to be rendered in a different resolution, color or when other arbitrary adjustments have to be made.

Any Julia set can be pasted by either

-   pasting the downloaded image or
-   pasting the filename of the downloaded image.

Please note that even when pasting the actual image, the **only thing taken into consideration is the filename**. Therefore the filename has to be the original one in the proprietary format - the only reason the pasting via the image itself is at all possible is because of convenience: Usually it will be faster to copy the image than to extract the filename.

For this purpose the filenames of the images of the Julia sets in this README are available below the images for convenient copying.

## Loading random Julia sets

In the download preview (opened by pressing "s" or clicking the "Save as png"-button in the upper right corner of the screen) there are three more options to generate Julia sets:

### Random

"Random" generates all parameters for the Julia set at random.

### Selected

"Selected" will send a request to a server and load the parameters of a random Julia set out of a predetermined selection of particularly interesting Julia sets.

### Community

"Community" will also send a request to a server but instead of choosing from a predetermined selection of Julia sets, it will instead take into consideration all Julia sets which have been downloaded by other people.

Note that **in order to use this feature, the option "send and load Julia sets (community)"** in the info-modal (press "i" or click the question mark in the lower right corner of the screen) **has to be checked**.

This will enable you to load Julia sets downloaded by others and also send the parameters of the sets you download to the server to share with others. No personal information whatsoever will be stored.
In case you **don't want to share** the parameters of the Julia set you are about to download you can **deactivate the option at any time in the settings-menu** (press "i" or click on the question mark in the lower right corner).

# Parameters

The following parameters can be adjusted to tweak the resulting image's appearance:

-   [Julia Coordinates (c value of the Julia set)](#julia-coordinates-c-value-of-the-julia-set)
-   [Escape Radius](#escape-radius)
-   [Exponent](#exponent)
-   [Number of Iterations](#number-of-iterations)
-   [Color](#color)

### Julia Coordinates (c value of the Julia set)

The Julia Coordinates determine the general shape of the Julia set. They can be adjusted by moving the mouse over the Mandelbrot set (if nothing happens, try pressing "f" to make the indicator follow the mouse; Look [here](#usage) for more information about the controls) or entering the values in the corresponding input-fields.

|                                           Julia Coordinates of about (0.3159,-0.0421)                                            |                                          Julia Coordinates of about (-1.4808,0.0014)                                           |
| :------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/juliaCoordinates/JuliaSet_14_7_7_800_2_100_0.315878380105945_-0.04211320165297236_0_0_1.7490062499999999_SC_NL1_0.jpg) | ![](/imgs/juliaCoordinates/JuliaSet_14_7_7_800_2_100_-1.480826496088234_0.0013867962695299548_0_0_24.25420005376_SC_NL1_1.jpg) |

```
JuliaSet_14_7_7_800_2_100_0.315878380105945_-0.04211320165297236_0_0_1.7490062499999999_SC_NL1_0.png
```

```
JuliaSet_14_7_7_800_2_100_-1.480826496088234_0.0013867962695299548_0_0_24.25420005376_SC_NL1_1.png
```

### Escape Radius

In order to check whether the aforementioned series diverges to infinity for a given point, we have to define a threshold value after which we "cut it off" since the range of 32 or even 64 bit numbers does not quite extend to actual infinity.

Though a bit niche, the value of this parameter can have a significant effect on the look of the image:

|                                                 Escape Radius of 1.1                                                 |                                                 Escape Radius of 100                                                 |
| :------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/escapeRadius/JuliaSet_9_19_6_800_2_1.1_-0.8463908030557178_0.19997727808059781_0_0_2.0113571875_NL1_0.jpg) | ![](/imgs/escapeRadius/JuliaSet_9_19_6_800_2_100_-0.8463908030557178_0.19997727808059781_0_0_2.0113571875_NL1_0.jpg) |

```
JuliaSet_9_19_6_800_2_1.1_-0.8463908030557178_0.19997727808059781_0_0_2.0113571875_NL1_0.png
```

```
JuliaSet_9_19_6_800_2_100_-0.8463908030557178_0.19997727808059781_0_0_2.0113571875_NL1_0.png
```

## Exponent

The exponent (very informally) decides "the number of branches". Non-Integer values are allowed.

|                                                Exponent of 2                                                |                                                       Exponent of 3                                                       |
| :---------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/exponent/JuliaSet_0_157_255_500_2_100_0.3847086259435044_0.10924501630539399_0_0_1.6_SC_LC_0.jpg) | ![](/imgs/exponent/JuliaSet_0_157_255_500_3_100_0.501419741737431_0.06545088539276347_0_0_1.8400000000000005_SC_LC_0.jpg) |

```
JuliaSet_0_157_255_500_2_100_0.3847086259435044_0.10924501630539399_0_0_1.6_SC_LC_0.png
```

```
JuliaSet_0_157_255_500_3_100_0.501419741737431_0.06545088539276347_0_0_1.8400000000000005_SC_LC_0.png
```

(Note that in these images not just the exponent was changed; Since the topology changes, the resulting images in the same position would not look similar. To emphasize the idea behind the exponent the position of the Julia Coordinates has been adjusted between the images)

## Number of Iterations

The accuracy with which the fractals are rendered depends not only on the escape radius but also on the number of iterations (i.e. the maximum value of $n$ in the aforementioned formula). Depending on the desired style adjusting the number of iterations can make a big difference on how "detailed" the resulting render is going to be:

|                                                      nrIterations of 100                                                       |                                                      nrIterations of 1000                                                       |
| :----------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/nrIterations/JuliaSet_4_11_11_100_2_100_-0.07290343182904654_0.6543711836041501_0_0_1.7490062499999994_SC_NL1_0.jpg) | ![](/imgs/nrIterations/JuliaSet_4_11_11_1000_2_100_-0.07290343182904654_0.6543711836041501_0_0_1.7490062499999994_SC_NL1_0.jpg) |

```
JuliaSet_4_11_11_100_2_100_-0.07290343182904654_0.6543711836041501_0_0_1.7490062499999994_SC_NL1_0.png
```

```
JuliaSet_4_11_11_1000_2_100_-0.07290343182904654_0.6543711836041501_0_0_1.7490062499999994_SC_NL1_0.png
```

Naturally, increasing the number of iterations will come with the price of decreased performance, though solely for rendering single frames even iteration counts in the thousands are considerably fast.

## Color

### Smooth Coloring

Despite being able to select the color used for rendering the image, there are certain functions one can apply:

When using linear coloring methods (Static Orange or Linear RGB) bands of color will appear because of the way the colors are calculated with the escape radius (it essentially boils down to the color values being integers). This can have its own asthetic, however, by enabling Smooth Coloring these bands of color should be (mostly) eliminated (the bands in this image are not that noticeable):

|                                                         Smooth Coloring off                                                          |                                                           Smooth Coloring on                                                            |
| :----------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/color/smoothColoring/JuliaSet_33_186_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_LC_0.jpg) | ![](/imgs/color/smoothColoring/JuliaSet_33_186_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_SC_LC_0.jpg) |

```
JuliaSet_33_186_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_LC_0.png
```

```
JuliaSet_33_186_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_SC_LC_0.png
```

### Static Orange and Linear RGB

Linear RGB is essentially taking the color value provided via the color picker and directly using it to render the fractal without modifying it any further.

|                                                 Linear RGB with value (26,117,0)                                                 |                                               Linear RGB with value (26,11,176)                                                |
| :------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/color/linearRGB/JuliaSet_26_117_0_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_SC_LC_0.jpg) | ![](/imgs/color/linearRGB/JuliaSet_26_11_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_1.8173403890875361_LC_0.jpg) |

```
JuliaSet_26_117_0_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_SC_LC_0.png
```

```
JuliaSet_26_11_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_1.8173403890875361_LC_0.png
```

### Static Orange

Static Orange does not take into account the color value provided but instead is just a static color (orange). The reason this has been included as its own option is simply because I think it looks awesome.

| Static Orange |
| :-----------------------------------------------------------------------------------------------------------------------------------:
| ![](/imgs/color/staticOrange/JuliaSet_33_186_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_SC_SO_0.jpg)

```
JuliaSet_33_186_176_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_SC_SO_0.png
```

### Nonlinear 1 and 2

Of course there are other ways to compose a color than just taking the input provided by the user and rendering directly from that. Both Nonlinear 1 and 2 take the input color into consideration, but transform it in a nonlinear fashion. That is, don't expect the resulting image to be red simply because you input a red color.

There are of course infinite possibilities when it comes to combining and tinkering with these color values, but for now I have settled on these two. Note that Nonlinear 2 is somewhat special in that it's quite hard to get images which are not completely over the top. It should be considered as more of on "experimental" setting. Choosing color values closer to zero makes both Nonlinear 1 and 2 a bit easier to work with.

|                                               Nonlinear 1 with value (17,39,33)                                                |                                               Nonlinear 2 with value (0,23,31)                                                |
| :----------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------: |
| ![](/imgs/color/nonlinear/JuliaSet_17_39_33_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_NL1_0.jpg) | ![](/imgs/color/nonlinear/JuliaSet_0_23_31_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_NL2_0.jpg) |

```
JuliaSet_17_39_33_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_NL1_0.png
```

```
JuliaSet_0_23_31_300_2_100_-0.780858194066575_0.15140706860098566_0_0_2.0113571874999994_NL2_0.png
```

Note that because of the nonlinearity, enabling Smooth Coloring will not have an effect on Nonlinear 1 and 2.

## Double precision using CPU rendering

By default WebGL uses 32 bit floating numbers (single precision). For the majority of use cases this will be plenty, however, when dealing with fractals it imposes a firm limit on how far one can zoom into the fractals before things start to get very pixelated.

Take a look at the following image, zoomed to a magnification of ~1183 compared to the initial display:

![image of Julia set around position (-0.167, 1.041) with a magnification of ~1183, resulting in a very pixelated image](./imgs/cpuRendering/JuliaSet_26_117_0_500_2_100_-0.16742_1.041285_0.0036808184336753905_-0.0032750417007097353_1183.213490258893_SC_NL1_0.jpg)

```
JuliaSet_26_117_0_500_2_100_-0.16742_1.041285_0.0036808184336753905_-0.0032750417007097353_1183.213490258893_SC_NL1_0.png
```

As you can see, it would probably not quite be categorized as "sharp". Note that this is not a problem with the implementation itself; It is an issue arising solely from a lack of precision.
Therefore this _can_ be mitigated by increasing the precision. The following image has been rendered using the exact same algorithms, the only difference being the employment of double precision:
![sharp image of Julia set around position (-0.167, 1.041) with a magnification of ~1183, rendered on the cpu using double precision](./imgs/cpuRendering/JuliaSet_26_117_0_500_2_100_-0.16742_1.041285_0.0036808184336753905_-0.0032750417007097353_1183.213490258893_SC_NL1_1.jpg)

```
JuliaSet_26_117_0_500_2_100_-0.16742_1.041285_0.0036808184336753905_-0.0032750417007097353_1183.213490258893_SC_NL1_1.png
```

There is a problem, though: WebGL does not natively support double precision. Claiming this to be an insurmountable obstacle would of course be an exaggeration: Naturally, there are ways to emulate double precision in WebGL, but this turns out to be a rather complicated endeavor which I, after some experimentation, for now have deemed to not be worth the effort - especially since we not only need the extra precision but the range as well.

The current (and cognitively cheap) solution is to make use of the fact that any number in JavaScript will be stored using 64 bit, meaning rendering on the CPU will provide us with an abundance of precision. Well, "abundance" in the sense that you will be less likely to be running into precision issues than others. Namely, under these new circumstances, the main concern becomes the performance, e.g. the time it takes to render a single frame on the CPU.

Here's where things start to become ugly. While even my integrated GPU will happily render at an at least somewhat useable frame rate under reasonable conditions, the CPU (which, remember, does not have access to thousands of cores running in parallel) will take its time and render at a steady <1 FPS. Admittedly, this might still be considered as misleading marketing, as the actual frame rate on my particular machine (AMD Ryzen 7 6800HS Creator Edition) for an image of resolution 3072x1920 will be anywhere in the range from around $0.05=\frac{1}{20}$ to about $0.0025=\frac{1}{400}$ FPS, with even longer rendering times being very possible. This means that in practice I will be waiting anywhere from 20 seconds to multiple minutes for a CPU rendering to complete.

### Avoiding pixelation with CPU rendering

To enhance the precision and therefore avoid possibe pixelation of the image when zooming in far, turn on CPU rendering by pressing the associated button in the download preview.
Turning CPU rendering on will render the current preview on the CPU **which will take some time**. A small progress bar acts as an indicator. Once you have turned CPU rendering on, simply press the download button to start rendering the final image. This will take **a very long time, not unlikely multiple minutes**.

Enabling CPU rendering will not stop you from interacting with the canvas as usual, but keep in mind that this is **tremendously slow** and if you are not running on NASA-level hardware you should probably refrain from trying to actually use this for real-time interaction.

Instead, **only activate CPU rendering when you want to download the currently displayed image**. If you have to make any adjustments other than simply centering a certain point (double clicking any point on the canvas will center it and result in only one frame being rendered) you are probably better off just turning the CPU rendering off, making your changes, turning it on again and then downloading your image.

## Gallery

![](/imgs/gallery/JuliaSet_26_117_0_300_2_100_-0.78014025688_0.14999212609_0_0_2.0113571874999994_SC_SO_0.jpg)

```
JuliaSet_26_117_0_300_2_100_-0.78014025688_0.14999212609_0_0_2.0113571874999994_SC_SO_0.png
```

![](/imgs/gallery/JuliaSet_8_196_21_500_2_100_-1.2571894763266953_0.043944953743533605_0_0_1.7490062499999994_SC_LC_0.jpg)

```
JuliaSet_8_196_21_500_2_100_-1.2571894763266953_0.043944953743533605_0_0_1.7490062499999994_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_0_255_255_300_2_100_-0.03520896708_0.68212169768_0_0_1.7_SC_SO_LC_0.jpg)

```
JuliaSet_0_255_255_300_2_100_-0.03520896708_0.68212169768_0_0_1.7_SC_SO_LC_0.png
```

![](/imgs/gallery/JuliaSet_29_13_89_400_3_100_0.15189491280043277_0.8262952878431588_0_0.19999999999999996_1.6000000000000005_SC_SO_LC_0.jpg)

```
JuliaSet_29_13_89_400_3_100_0.15189491280043277_0.8262952878431588_0_0.19999999999999996_1.6000000000000005_SC_SO_LC_0.png
```

![](/imgs/gallery/JuliaSet_26_117_0_2000_2_100_-0.7496730814324626_0.09462390076501138_0_0_2.0113571875_SC_LC_0.jpg)

```
JuliaSet_26_117_0_2000_2_100_-0.7496730814324626_0.09462390076501138_0_0_2.0113571875_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_26_117_0_2000_2_100_-0.7496730814324626_0.09462390076501138_0.5007149877928196_-0.04815466531405051_28.625176191121408_SC_LC_0.jpg)

```
JuliaSet_26_117_0_2000_2_100_-0.7496730814324626_0.09462390076501138_0.5007149877928196_-0.04815466531405051_28.625176191121408_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_0_5_138_100_1.6_100_0.024453850672851773_0.6251531559765986_-0.34615652901785654_0.45744063654556705_5_SC_LC_0.jpg)

```
JuliaSet_0_5_138_100_1.6_100_0.024453850672851773_0.6251531559765986_-0.34615652901785654_0.45744063654556705_5_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_117_0_0_300_2_100_-0.7475393749688978_-0.2100862511405278_0_0_1.7490062499999997_SC_LC_0.jpg)

```
JuliaSet_117_0_0_300_2_100_-0.7475393749688978_-0.2100862511405278_0_0_1.7490062499999997_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_0_255_98_300_5_100_-0.66998524767_0.10462637826_0_0_1.7_SC_LC_0.jpg)

```
JuliaSet_0_255_98_300_5_100_-0.66998524767_0.10462637826_0_0_1.7_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_26_117_0_300_4_100_-0.24539007092_0.44326241134_0_0_1.6_SC_SO_0.jpg)

```
JuliaSet_26_117_0_300_4_100_-0.24539007092_0.44326241134_0_0_1.6_SC_SO_0.png
```

![](/imgs/gallery/JuliaSet_26_117_0_3000_2_100_-0.77788869438_0.11616126527_0_0_2_SC_LC_1.jpg)

```
JuliaSet_26_117_0_3000_2_100_-0.77788869438_0.11616126527_0_0_2_SC_LC_1.png
```

![](/imgs/gallery/JuliaSet_66_12_70_300_2.3_100_-0.68721290525_0.41840712662_-0.4505464126740924_0.29732234398657575_10.2_SC_LC_0.jpg)

```
JuliaSet_66_12_70_300_2.3_100_-0.68721290525_0.41840712662_-0.4505464126740924_0.29732234398657575_10.2_SC_LC_0.png
```

![](/imgs/gallery/JuliaSet_6_5_5_2000_2_100_-0.7496730814324626_0.09462390076501138_0_0_2.0113571875_SC_NL1_0.jpg)

```
JuliaSet_6_5_5_2000_2_100_-0.7496730814324626_0.09462390076501138_0_0_2.0113571875_SC_NL1_0.png
```

![](/imgs/gallery/JuliaSet_10_10_10_300_2_100_-0.16394123239_1.02832470755_0_0_10.485760000000006_NL1_0.jpg)

```
JuliaSet_10_10_10_300_2_100_-0.16394123239_1.02832470755_0_0_10.485760000000006_NL1_0.png
```

![](/imgs/gallery/JuliaSet_10_10_11_300_5_100_-0.022375940834254315_-0.6003913825713039_-4.440892098500626e-16_0.10000000000000009_1.7490062499999994_NL1_0.jpg)

```
JuliaSet_10_10_11_300_5_100_-0.022375940834254315_-0.6003913825713039_-4.440892098500626e-16_0.10000000000000009_1.7490062499999994_NL1_0.png
```

![](/imgs/gallery/JuliaSet_8_8_8_300_2_100_-1.4022609899720428_-0.0001091379300751788_0_0_1.7490062499999994_NL1_0.jpg)

```
JuliaSet_8_8_8_300_2_100_-1.4022609899720428_-0.0001091379300751788_0_0_1.7490062499999994_NL1_0.png
```

![](/imgs/gallery/JuliaSet_10_10_11_300_5_100_-0.022375940834254315_-0.6003913825713039_2.220446049250313e-16_0.10000000000000009_1.7490062499999994_NL2_0.jpg)

```
JuliaSet_10_10_11_300_5_100_-0.022375940834254315_-0.6003913825713039_2.220446049250313e-16_0.10000000000000009_1.7490062499999994_NL2_0.png
```

![](/imgs/gallery/JuliaSet_82_82_82_300_2_100_-1.4022609899720428_-0.0001091379300751788_0_0_1.7490062499999994_SC_LC_0.jpg)

```
JuliaSet_82_82_82_300_2_100_-1.4022609899720428_-0.0001091379300751788_0_0_1.7490062499999994_SC_LC_0.png
```

![](imgs/gallery/JuliaSet_4_32_27_300_2_100_-0.7914893617_0.15957446808_0_0_2.0113571875_NL1_0.jpg)

```
JuliaSet_4_32_27_300_2_100_-0.7914893617_0.15957446808_0_0_2.0113571875_NL1_0.png
```

![](/imgs/gallery/JuliaSet_3_17_18_300_2_100_-0.15170287943117378_-1.0317105973651144_0_0_17_NL1_0.jpg)

```
JuliaSet_3_17_18_300_2_100_-0.15170287943117378_-1.0317105973651144_0_0_17_NL1_0.png
```

![](/imgs/gallery/JuliaSet_3_2_2_2000_2_200_0.0025903758029869385_-0.8415233902387567_0.009638394367543851_0.007179008152411894_1844.674407370957_SC_NL1_1.jpg)

```
JuliaSet_3_2_2_2000_2_200_0.0025903758029869385_-0.8415233902387567_0.009638394367543851_0.007179008152411894_1844.674407370957_SC_NL1_1.png
```

![](/imgs/gallery/JuliaSet_3_2_2_3000_2_200_0.0025903758029869385_-0.8415233902387567_0.009656971802734473_0.007204487648551581_17261.763739293347_SC_NL1_1.jpg)

```
JuliaSet_3_2_2_3000_2_200_0.0025903758029869385_-0.8415233902387567_0.009656971802734473_0.007204487648551581_17261.763739293347_SC_NL1_1.png
```

![](/imgs/gallery/JuliaSet_143_240_164_800_2_100_-0.76691168686_0.100515236_0.019772085877568565_-0.010025942429340951_478_NL1_1.jpg)

```
JuliaSet_143_240_164_800_2_100_-0.76691168686_0.100515236_0.019772085877568565_-0.010025942429340951_478_NL1_1.png
```

![](/imgs/gallery/JuliaSet_143_240_164_800_2_100_-0.76691168686_0.100515236_0.004039488060000929_0.005384618199999689_68.719487_NL1_1.jpg)

```
JuliaSet_143_240_164_800_2_100_-0.76691168686_0.100515236_0.004039488060000929_0.005384618199999689_68.719487_NL1_1.png
```

![](/imgs/gallery/JuliaSet_143_240_164_800_2_100_-0.76691168686_0.100515236_0_0_323.696221_NL1_1.jpg)

```
JuliaSet_143_240_164_800_2_100_-0.76691168686_0.100515236_0_0_323.696221_NL1_1.png
```

![](imgs/gallery/JuliaSet_64_64_64_300_2_100_0.3964912460069005_-0.11114750490363327_-0.3632525081259468_0.4064276521725143_1433.1369664947788_SC_NL1_0.jpg)

```
JuliaSet_64_64_64_300_2_100_0.3964912460069005_-0.11114750490363327_-0.3632525081259468_0.4064276521725143_1433.1369664947788_SC_NL1_0.png
```

![](/imgs/gallery/JuliaSet_64_64_64_300_2_100_0.396491246_-0.11114750490363327_-0.36130524106287065_0.4061376851749293_6.152787621294764_NL1_0.jpg)

```
JuliaSet_64_64_64_300_2_100_0.396491246_-0.11114750490363327_-0.36130524106287065_0.4061376851749293_6.152787621294764_NL1_0.png
```

![](/imgs/gallery/JuliaSet_33_153_0_800_1.6_1.5_-0.250352790663022_0.000007719731867321736_-0.48337918252933576_0.140760256476548_16.5_NL1_0.jpg)

```
JuliaSet_33_153_0_800_1.6_1.5_-0.250352790663022_0.000007719731867321736_-0.48337918252933576_0.140760256476548_16.5_NL1_0.png
```

![](/imgs/gallery/JuliaSet_33_153_0_800_1.6_1.5_-0.250352790663022_0.000007719731867321736_-0.48361040284183265_0.13917462789789015_80000_NL1_1.jpg)

```
JuliaSet_33_153_0_800_1.6_1.5_-0.250352790663022_0.000007719731867321736_-0.48361040284183265_0.13917462789789015_80000_NL1_1.png
```

![](/imgs/gallery/JuliaSet_87_46_0_300_2_100_-1.732003181528324_0.0005689846081828028_0_0_292.4722788690716_NL1_1.jpg)

```
JuliaSet_87_46_0_300_2_100_-1.732003181528324_0.0005689846081828028_0_0_292.4722788690716_NL1_1.png
```

![](/imgs/gallery/JuliaSet_87_46_0_300_2_100_-1.732003181528324_0.0005689846081828028_4.336808689942018e-19_0_1170_NL1_1.jpg)

```
JuliaSet_87_46_0_300_2_100_-1.732003181528324_0.0005689846081828028_4.336808689942018e-19_0_1170_NL1_1.png
```

![](/imgs/gallery/JuliaSet_28_43_23_300_2_100_-1.7320181472671567_-0.00005375297762086844_0.004712710038807938_0.004132359312459068_676.506153284983_NL1_1.jpg)

```
JuliaSet_28_43_23_300_2_100_-1.7320181472671567_-0.00005375297762086844_0.004712710038807938_0.004132359312459068_676.506153284983_NL1_1.png
```

![](/imgs/gallery/JuliaSet_3_2_2_800_2_200_0.003099169998155022_-0.8415373683947535_0_0_49.39212390400001_SC_NL1_0.jpg)

```
JuliaSet_3_2_2_800_2_200_0.003099169998155022_-0.8415373683947535_0_0_49.39212390400001_SC_NL1_0.png
```

![](/imgs/gallery/JuliaSet_12_8_8_300_2_100_-0.15450244843651126_-1.030915463226788_0_0_16.36653739294609_NL1_1.jpg)

```
JuliaSet_12_8_8_300_2_100_-0.15450244843651126_-1.030915463226788_0_0_16.36653739294609_NL1_1.png
```

![](/imgs/gallery/JuliaSet_12_8_8_800_2_100_-0.16742_1.041285_0_0_221.15106152670825_SC_NL1_1.jpg)

```
JuliaSet_12_8_8_800_2_100_-0.16742_1.041285_0_0_221.15106152670825_SC_NL1_1.png
```

![](/imgs/gallery/JuliaSet_3_7_7_1000_2_200_0.002882185548504547_-0.8418782290900625_0_0_1152.921504606848_SC_NL1_1.jpg)

```
JuliaSet_3_7_7_1000_2_200_0.002882185548504547_-0.8418782290900625_0_0_1152.921504606848_SC_NL1_1.png
```

![](/imgs/gallery/JuliaSet_26_117_0_800_2_100_-0.7549402128886705_-0.06970267577711599_0_0_2.0113571874999994_SC_NL1_0.jpg)

```
JuliaSet_26_117_0_800_2_100_-0.7549402128886705_-0.06970267577711599_0_0_2.0113571874999994_SC_NL1_0.png
```

![](/imgs/gallery/JuliaSet_51_30_0_300_2_100_-0.21662323832659428_0.67901111222664_0_0_63_NL1_1.jpg)

```
JuliaSet_51_30_0_300_2_100_-0.21662323832659428_0.67901111222664_0_0_63_NL1_1.png
```

![](/imgs/gallery/JuliaSet_50_34_73_300_2_100_-0.10992117262385923_-0.6493566978792168_0.27425751438834145_0.23067446202430192_634.4004191673284_NL1_1.jpg)

```
JuliaSet_50_34_73_300_2_100_-0.10992117262385923_-0.6493566978792168_0.27425751438834145_0.23067446202430192_634.4004191673284_NL1_1.png
```

![](/imgs/gallery/JuliaSet_26_117_0_500_2_100_-0.16742077184165358_1.0412805126283333_0.0025636070166733423_-0.0027696611654754698_684.9412083277107_NL1_1.jpg)

```
JuliaSet_26_117_0_500_2_100_-0.16742077184165358_1.0412805126283333_0.0025636070166733423_-0.0027696611654754698_684.9412083277107_NL1_1.png
```

![](/imgs/gallery/JuliaSet_26_117_0_800_2_100_-1.7490147783251233_0_0_0_12.37545360525224_SC_NL1_0.jpg)

```
JuliaSet_26_117_0_800_2_100_-1.7490147783251233_0_0_0_12.37545360525224_SC_NL1_0.png
```

![](/imgs/gallery/JuliaSet_17_77_0_800_2_100_-0.7718575599396327_0.1256264026270783_0.22664876374966858_0.2291911494640187_39.290583859262966_SC_LC_NL1.jpg)

```
JuliaSet_17_77_0_800_2_100_-0.7718575599396327_0.1256264026270783_0.22664876374966858_0.2291911494640187_39.290583859262966_SC_LC_NL1.png
```

![](/imgs/gallery/JuliaSet_21_97_0_300_2_100_-0.23105193815979266_0.691394452200187_-0.3132332291843954_0.42493066485744435_110_NL1_0.jpg)

```
JuliaSet_21_97_0_300_2_100_-0.23105193815979266_0.691394452200187_-0.3132332291843954_0.42493066485744435_110_NL1_0.png
```

![](/imgs/gallery/JuliaSet_28_13_13_800_2_100_-0.039716312056737646_0.6737588652482269_0.23415854718457418_0.05605793300612717_71_NL1_0.jpg)

```
JuliaSet_28_13_13_800_2_100_-0.039716312056737646_0.6737588652482269_0.23415854718457418_0.05605793300612717_71_NL1_0.png
```

![](/imgs/gallery/JuliaSet_12_8_8_300_3_100_0.002241051209661497_1.097510307468028_-4.440892098500626e-16_0.1999999999999993_1.7490062499999994_NL1_0.jpg)

```
JuliaSet_12_8_8_300_3_100_0.002241051209661497_1.097510307468028_-4.440892098500626e-16_0.1999999999999993_1.7490062499999994_NL1_0.png
```

![](/imgs/gallery/JuliaSet_12_8_8_300_3_100_0.40832336029491056_-0.005544262393407884_0_0_1.7490062499999994_NL1_1.jpg)

```
JuliaSet_12_8_8_300_3_100_0.40832336029491056_-0.005544262393407884_0_0_1.7490062499999994_NL1_1.png
```
