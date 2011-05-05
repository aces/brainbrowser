  %% 
  %% This is file `baposter.cls'
  %% 
  %% A relatively comfortable latex class to produce posters with a grid based 
  %% layout. It comes with a number of combinable styles and is (maybe only for 
  %% the writer) easy to extend, as all the graphics is based on pgf.
  %%
  %% It is meant to be used with pdftex, but might also work with pslatex if you
  %% are not interested in things like transparency.
  %%
  %% Copyright (C) 2007-2010 Brian Amberg
  %%
  %% 07. April 2011: Fixed paper size handling
  %%     - Fixed Paper Size handling, you can now specify all page sizes using paperwidth=, paperheight= class options.
  %%     - Added rudimentary documentation of the available keys.
  %% 11. December 2010: Fixed "Empty Second Page" bug
  %%     - A second empty page was introduced when a document ended with 
  %%           \end{poster}
  %%         \end{document}
  %%       This was fixed thanks to a suggestion by Martin Aulbach
  %%     - Added
  %%         \thispagestyle{empty}
  %%       to suppress page numbers, which became visible when the margins are large.
  %%       The underlying problem of page-size handling has not yet been solved.
  %% 30. September 2010: Border Bugfixes
  %%     - Correct background color with textborder=rounded-small, Thanks to Ke Chen for the bugreport and patch
  %%     - Correctly draw rectangular text boxes, Thanks to abenkst for the bugreport and fix
  %% 10. June 2010: Added option to set the number of columns
  %%     - added a class option to set the number of columns
  %%         - columns=5: sets the number of columns to 5, possible values are 1..6, default is 3 in portrait and 4 in landscape format 
  %% 29. April 2009: Incorporated Patches by Arne Henningsen
  %%     - added some class options
  %%        - a4shrink: shrink the paper to A4 size (for printing drafts or handouts)
  %%        - movebody=Xpt: move the text/poster body Xpt to the right
  %%                    (or to the left if Xpt is negative),
  %%                    e.g. for manually centering the poster on the page
  %%        - showframe: use the "showframe" option of the "geometry" package
  %%        - a0paper (default): set paper size to A0
  %%        - archE: set paper size to Arch E
  %%     - setting "background" can be "none" now (otherwise the "showframe"
  %%          option has no effect)
  %%     - the page number has been removed (it was mostly not visible before)
  %%     - the "margin=" option works now
  %% 04. December 2008
  %%     - Mainly an update to the landscape example
  %% 14. November 2008
  %%     - Actually center the title when eyecatcher is used.
  %% 04. November 2008
  %%     - Fixed bug with eyecatcher not working.
  %% 26. June 2008
  %%     - Fixed bug with plain background mode.
  %% 14. June 2008
  %%     - Support for portrait/landscape switching.
  %%     - Some smaller bugfixes.
  %% 01. June 2007
  %%     - First version released.
  %%
  %% Use this class with pdflatex
  %%
  %% I have confirmed that this package works with 
  %%   - texlive 2007 and 
  %%   - miktex 2.7
  %%
  %% It does not seem to work with 
  %%   - miktex 2.2
  %%   - some old versions of tetex
  %%
  %% Licence: GPL
  \ProvidesClass{baposter}[2011/04/07 v1.10 baposter class]
  \NeedsTeXFormat{LaTeX2e}[1995/06/01]
  \LoadClass{article}
  \typeout{baposter: Brian Amberg, 2007, 2008, 2009, 2010, 2011 | http://www.brian-amberg.de/uni/poster/}

  %% Define lengths only once on inclusion, such that we can make multiple posters
  \newlength{\baposter@basepaperwidth}  
  \newlength{\baposter@basepaperheight}
  \newlength{\baposter@basemargin}    
  \newlength{\baposter@finalpaperwidth}  
  \newlength{\baposter@finalpaperheight}
  \newlength{\baposter@finalmargin}    
  \newlength{\headerheight}%
  \newlength{\colwidth}%
  \newlength{\colheight}%
  \newlength{\baposter@@colspacing}%
  \newlength{\boxstartx}%
  \newlength{\boxstarty}%
  \newlength{\boxwidth}%
  \newlength{\boxheight}%
  \newlength{\baposter@titleimage@left@width}%
  \newlength{\baposter@titleimage@right@width}%
  \newlength{\baposter@titleimage@textwidth}%
  \newbox\baposter@content%
  \newbox\baposter@titleimage@left%
  \newbox\baposter@titleimage@title%
  \newbox\baposter@titleimage@right%

  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  % Packages
  %-------------------------------------------------------------------------------
  % The only ``weird'' dependency of this package is pgf. All the rest should be
  % installed on any decent system.
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  \typeout{Use Packages}
  \usepackage{xkeyval}
  \usepackage{calc}
  \usepackage[cmyk]{xcolor}
  \usepackage{tikz}
  \usepackage{pgf}
  \usepackage{ifthen}
  \usepackage[T1]{fontenc}

  \usetikzlibrary{decorations}

  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  % Settings
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  % TODO: Add package options
  \typeout{Setup}

  % Choose a smaller value for larger fonts
  \newcommand{\baposter@fontscale}{0.292}
  % use the ``showframe'' option of the ``geometry'' package?
  \newcommand{\baposter@showframe}{false}

  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  % Zoom
  %-------------------------------------------------------------------------------
  % We scale the page from fontscale * papersize up to papersize
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  \typeout{Zoom}

  \newif\iflandscape
  \DeclareOptionX{landscape}{\landscapetrue}
  \DeclareOptionX{portrait}{}

  \newcommand{\baposter@setfinalpapersize}[2]{\setlength{\baposter@finalpaperwidth}{#1}\setlength{\baposter@finalpaperheight}{#2}}
  \baposter@setfinalpapersize{841mm}{1189mm}

  \DeclareOptionX{archE}{  \baposter@setfinalpapersize{91.44cm}{121.92cm}}
  \DeclareOptionX{paperwidth}[841mm]{\setlength{\baposter@finalpaperwidth}{#1}}
  \DeclareOptionX{paperheight}[1189mm]{\setlength{\baposter@finalpaperheight}{#1}}
  \DeclareOptionX{a0paper}{\baposter@setfinalpapersize{841mm}{1189mm}}
  \DeclareOptionX{a1paper}{\baposter@setfinalpapersize{594mm}{841mm}}
  \DeclareOptionX{a2paper}{\baposter@setfinalpapersize{420mm}{594mm}}
  \DeclareOptionX{a3paper}{\baposter@setfinalpapersize{297mm}{420mm}}
  \DeclareOptionX{a4paper}{\baposter@setfinalpapersize{210mm}{297mm}}
  \DeclareOptionX{a4paper}{\baposter@setfinalpapersize{210mm}{297mm}}

  \DeclareOptionX{showframe}{\renewcommand{\baposter@showframe}{true}}

  \setlength{\baposter@finalmargin}{1.5cm}
  \DeclareOptionX{fontscale}[0.292]{\renewcommand{\baposter@fontscale}{#1}}
  \DeclareOptionX{margin}   [1.5cm]{\setlength{\baposter@finalmargin}{#1}}

  % move text/poster body to the right (or to the left if negative)
  \newlength{\baposter@movebody}
  \setlength{\baposter@movebody}{0cm}
  \DeclareOptionX{movebody}[0cm]{\setlength{\baposter@movebody}{#1}}
  \ProcessOptionsX

  \iflandscape
  \typeout{Swapping paper sizes}
  \newlength{\baposter@swappapersizes}
  \setlength{\baposter@swappapersizes}{\baposter@finalpaperwidth}
  \setlength{\baposter@finalpaperwidth}{\baposter@finalpaperheight}
  \setlength{\baposter@finalpaperheight}{\baposter@swappapersizes}
  \fi

  \setlength{\baposter@basepaperwidth} {\baposter@fontscale\baposter@finalpaperwidth }
  \setlength{\baposter@basepaperheight}{\baposter@fontscale\baposter@finalpaperheight}
  \setlength{\baposter@basemargin}     {\baposter@fontscale\baposter@finalmargin}
  \newlength{\baposter@basemarginright}
  \setlength{\baposter@basemarginright}{\baposter@basemargin}
  \addtolength{\baposter@basemarginright}{-\baposter@fontscale\baposter@movebody}
  \newlength{\baposter@basemarginleft}
  \setlength{\baposter@basemarginleft}{\baposter@basemargin}
  \addtolength{\baposter@basemarginleft}{\baposter@fontscale\baposter@movebody}

\typeout{Paperwidth=\the\baposter@finalpaperwidth}
\typeout{Paperheight=\the\baposter@finalpaperheight}
\typeout{BasePaperwidth=\the\baposter@basepaperwidth}
\typeout{BasePaperheight=\the\baposter@basepaperheight}
\usepackage[
   paperwidth=\baposter@basepaperwidth,
   paperheight=\baposter@basepaperheight,
   tmargin=\baposter@basemargin,
   bmargin=\baposter@basemargin,
   lmargin=\baposter@basemarginleft,
   rmargin=\baposter@basemarginright,
   showframe=\baposter@showframe,portrait]{geometry} % The portrait switch is necessary to override the double swapping which would otherwise happen in landscape mode

\usepackage{pgfpages}
\pgfpagesuselayout{resize to}[physical paper width=\baposter@finalpaperwidth,physical paper height=\baposter@finalpaperheight]

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% New Version, with specified size
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% TODO: Use choose-keys
\typeout{Keys}
\define@cmdkey[ba]{poster}[baposter@]{grid}                  [no]          {}
\define@cmdkey[ba]{poster}[baposter@]{eyecatcher}            [yes]         {}
\define@cmdkey[ba]{poster}[baposter@]{columns}               [{}]          {}
\define@cmdkey[ba]{poster}[baposter@]{textborder}            [faded]       {}
\define@cmdkey[ba]{poster}[baposter@]{headerborder}          [none]        {}
\define@cmdkey[ba]{poster}[baposter@]{headershape}           [roundedright]{}
\define@cmdkey[ba]{poster}[baposter@]{colspacing}            [1em]         {}
\define@cmdkey[ba]{poster}[baposter@]{headerheight}          [0.1\textheight]{}
\define@cmdkey[ba]{poster}[baposter@]{headershade}           [shade-lr]    {}
\define@cmdkey[ba]{poster}[baposter@]{boxshade}              [none]        {}

\definecolor{baposter@silver}{cmyk}{0,0,0,0.7}
\define@cmdkey[ba]{poster}[baposter@]{color}                 [orange]      {}
\define@cmdkey[ba]{poster}[baposter@]{colortwo}              [white]       {}
\define@cmdkey[ba]{poster}[baposter@]{bgColorOne}            [baposter@silver]{}
\define@cmdkey[ba]{poster}[baposter@]{bgColorTwo}            [green]       {}
\define@cmdkey[ba]{poster}[baposter@]{borderColor}           [yellow]      {}
\define@cmdkey[ba]{poster}[baposter@]{headerColorOne}        [red]         {}
\define@cmdkey[ba]{poster}[baposter@]{headerColorTwo}        [brown]       {}
\define@cmdkey[ba]{poster}[baposter@]{headerFontColor}       [black]       {}
\define@cmdkey[ba]{poster}[baposter@]{boxColorOne}           [magenta]     {}
\define@cmdkey[ba]{poster}[baposter@]{boxColorTwo}           [cyan]        {}

\define@cmdkey[ba]{poster}[baposter@]{background}            [plain]       {}
\define@cmdkey[ba]{poster}[baposter@]{headerfont}            [\sc\Large]   {}
\define@cmdkey[ba]{poster}[baposter@]{textfont}              [{}]          {}

\define@cmdkey[ba]{poster}[baposter@]{linewidth}             [2pt]         {}

\define@cmdkey[ba]{posterbox}[baposter@box@]{below}  [notset]{}
\define@cmdkey[ba]{posterbox}[baposter@box@]{above}  [notset]{}
\define@cmdkey[ba]{posterbox}[baposter@box@]{aligned}[notset]{}
\define@cmdkey[ba]{posterbox}[baposter@box@]{bottomaligned}[notset]{}
\define@cmdkey[ba]{posterbox}[baposter@box@]{column} [0]     {}
\define@cmdkey[ba]{posterbox}[baposter@box@]{row}    [0]     {}
\define@cmdkey[ba]{posterbox}[baposter@box@]{span}   [1]     {}
\define@cmdkey[ba]{posterbox}[baposter@box@]{height} [auto]  {}
\define@cmdkey[ba]{posterbox}[baposter@box@]{name}   [noname]{}

\newcommand{\baposter@backgroundCmd}{\error{No background command defined. Use \background{...} to define background}}
\newcommand{\background}[1]{\renewcommand{\baposter@backgroundCmd}{#1}}

\presetkeys[ba]{poster}{
  % Debug grid
  grid=no,
  % Is there an eyecatcher image
  eyecatcher=yes,
  columns={},
  % Colours
  bgColorOne=baposter@silver,
  bgColorTwo=green,
  borderColor=yellow,
  headerColorOne=red,
  headerColorTwo=brown,
  headerFontColor=black,
  boxColorOne=magenta,
  boxColorTwo=cyan,
  % Style
  headerborder=none,
  colspacing=1em,
  headerheight=0.1\textheight,
  background=shade-lr,
  headershade=shade-lr,
  boxshade=none,
  headerfont=\sc\Large,% or headerfont=\color{white}\textsf\textbf
  textfont={},
  linewidth=2pt
}{}
\presetkeys[ba]{posterbox}{
  % Position
  column=0,row=0,span=1,
  below=notset,above=notset,
  bottomaligned=notset,
  aligned=notset,
  height=auto,
  % Name
  name=noname,
}{}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% The main poster environment
%%% \begin{baposter}{settings}{Eye Catcher}{Title}{Author}{University Logo}
%%%-----------------------------------------------------------------------------
%%% The settings are
%%%   - grid=yes,[no]:    Show grid to help with alignment
%%%   - colspacing=0.7em: Column spacing
%%%   - columns=4:        number of columns (default 4 in landscape and 3 in portrait format) (maximum number is 6)
%%%   - color=[orange]:   xcolor color definition used as the main color of the poster
%%%   - colortwo=[white]: The other color for gradient based layouts
%%%   - textborder=none,bars,coils,triangles,rectangle,rounded,small-rounded,roundedleft,roundedright,[faded]
%%%                       The style of the box around the text area
%%%   - headerborder=none,closed,open
%%%                       No extra border around box header, full border around box header or border that is open below.
%%%   - headershape=rectangle,rounded,roundedleft,roundedright
%%%                       Shape of the box-header region
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\newenvironment{poster}[5]{%
  \thispagestyle{empty}% Suppress Page Number
  \typeout{Poster Starts}%
  \setkeys[ba]{poster}{#1}%
%
  % Parse Keys%
  \colorlet{bgColorOne}{\baposter@bgColorOne}
  \colorlet{bgColorTwo}{\baposter@bgColorTwo}
  \colorlet{borderColor}{\baposter@borderColor}
  \colorlet{headerColorOne}{\baposter@headerColorOne}
  \colorlet{headerColorTwo}{\baposter@headerColorTwo}
  \colorlet{headerFontColor}{\baposter@headerFontColor}
  \colorlet{boxColorOne}{\baposter@boxColorOne}
  \colorlet{boxColorTwo}{\baposter@boxColorTwo}
%
  %% Boxes%
  \setlength{\headerheight}{\baposter@headerheight}%
  \setlength{\colheight}{\textheight-\baposter@headerheight}%
%
  \typeout{Format}%
  \iflandscape%
    \ifthenelse{\equal{\baposter@columns}{}}{\renewcommand{\baposter@columns}{4}}{}
  \else%
    \ifthenelse{\equal{\baposter@columns}{}}{\renewcommand{\baposter@columns}{3}}{}
  \fi%
%
  \typeout{Columns: \baposter@columns}%
  \setlength{\baposter@@colspacing}{\baposter@colspacing}%
  \typeout{1}%
  \setlength{\colwidth}{\textwidth}%
  \typeout{2}%
  \addtolength{\colwidth}{-\baposter@columns\baposter@@colspacing}\addtolength{\colwidth}{\baposter@@colspacing}%
  \typeout{3}%
  \ifthenelse{\equal{\baposter@columns}{1}}{
    \setlength{\colwidth}{\colwidth}%
  }{
    \ifthenelse{\equal{\baposter@columns}{2}}{
      \setlength{\colwidth}{0.5\colwidth}%
    }{
      \ifthenelse{\equal{\baposter@columns}{3}}{
        \setlength{\colwidth}{0.3333333333333\colwidth}%
      }{
        \ifthenelse{\equal{\baposter@columns}{4}}{
          \setlength{\colwidth}{0.25\colwidth}%
        }{
          \ifthenelse{\equal{\baposter@columns}{5}}{
            \setlength{\colwidth}{0.2\colwidth}%
          }{
            \ifthenelse{\equal{\baposter@columns}{6}}{
              \setlength{\colwidth}{0.16666666666\colwidth}%
            }{
              \error{You do not want so many columns}
            }
          }
        }
      }
    }
  }
%
  % Background image%
  \newcommand{\baposterShadedBG}{%
    \ifthenelse{\equal{\baposter@background}{shade-lr}}{%
      \begin{tikzpicture}[remember picture,overlay]%
        \shade [shading=axis,right color=bgColorOne,left color=bgColorTwo] (current page.north west) rectangle(current page.south east);
        \typeout{BAPOSTER: Using shade left right background.}
      \end{tikzpicture}%
    }{%
      \ifthenelse{\equal{\baposter@background}{shade-tb}}{%
        \typeout{BAPOSTER: Using shade top to bottom background.}
        \begin{tikzpicture}[remember picture,overlay]%
          \shade [shading=axis,top color=bgColorOne,bottom color=bgColorTwo] (current page.north west) rectangle(current page.south east);
        \end{tikzpicture}%
      }{%
        \ifthenelse{\equal{\baposter@background}{plain}}{%
          \typeout{BAPOSTER: Using plain background.}
          \begin{tikzpicture}[remember picture,overlay]%
            \fill [fill=bgColorOne] (current page.north west) rectangle(current page.south east);
          \end{tikzpicture}%
        }{%
          \ifthenelse{\equal{\baposter@background}{user}}{%
            \typeout{BAPOSTER: Using user background.}
            \baposter@backgroundCmd%
          }{%
            \ifthenelse{\equal{\baposter@background}{none}}{%
              \typeout{BAPOSTER: Using no background.}
            }{%
              \error{Unknown background, use shade-lr, shade-tb, plain, none, or user. If user is used, you also have to define \background{...} }%
            }%
          }%
        }%
      }%
    }%
  }%
%
  \newcommand{\baposter@reference}{north west}%
%
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  % A box with a header and some content. The basic unit of the poster%
  %---------------------------------------------------------------------------%
  % Each box has a name and can be placed absolutely or relatively.%
  % The only inconvenience is that you can only specify a relative position %
  % towards an already declared box. So if you have a box attached to the %
  % bottom, one to the top and a third one which should be inbetween, you %
  % have to specify the top and bottom boxes before you specify the middle %
  % box.%
  %%
  % below=  name of other node%
  % above=  name of other node%
  % aligned=name of other node%
  % bottomaligned=name of other node%
  % column= [0]     %
  % row=    [0]     %
  % span=   [1]     %
  % height= <size in percent of column height>,[auto]%
  % name=   [noname]%
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  \newcommand{\headerbox}[3]{%
    \typeout{##2}%
    \setkeys[ba]{posterbox}{##2}%
%
%
    %% The columns is always given absolute
    % boxstartx = \baposter@box@column * colwidth + (\baposter@box@column-1) * baposter@@colspacing
    \setlength{\boxstartx}{\baposter@box@column\colwidth}%
    \addtolength{\boxstartx}{\baposter@box@column\baposter@@colspacing}%
%
    %% The width is gvien absolute
    % Box Width = \baposter@box@span * colwidth + (\baposter@box@span-1) * baposter@@colspacing
    \setlength{\boxwidth}{\baposter@box@span\colwidth} %
    \addtolength{\boxwidth}{\baposter@box@span\baposter@@colspacing}%
    \addtolength{\boxwidth}{-\baposter@@colspacing}%
%
    %% Measure the content of the box%
    \setbox\baposter@content=\hbox{%
      \begin{pgfinterruptpicture}%
        \begin{minipage}[t]{\boxwidth-1em}%
          \baposter@textfont{##3}%
        \end{minipage}%
      \end{pgfinterruptpicture}%
    }%
    \setlength{\boxheight}{\ht\baposter@content}\addtolength{\boxheight}{\dp\baposter@content}%
    \addtolength{\boxheight}{2em} % Header%
    \addtolength{\boxheight}{1em} % Inner Sep%
%
    \ifthenelse{\equal{\baposter@box@height}{bottom}}{%
    }{\ifthenelse{\equal{\baposter@box@height}{auto}}{%
    }{ % Neither auto nor bottom%
      \setlength{\boxheight}{\baposter@box@height\colheight}%
    }}%
%
    %% Determine the box position%
    \typeout{Setting Coordinates}%
    \typeout{Upper Right}%
    \typeout{\baposter@box@name}%
%
    %%% Upper Right Corner%
    \ifthenelse{\not\equal{\baposter@box@below}{notset} }{%
      %% Below%
      \typeout{Below}%
      \path[shape=coordinate] (\boxstartx,0pt |- \baposter@box@below se) ++(0pt,-\baposter@@colspacing) coordinate(\baposter@box@name nw);%
    }{%
      \ifthenelse{\not\equal{\baposter@box@aligned}{notset} }{%
        %% Aligned%
        \typeout{Aligned: \baposter@box@aligned}%
        \path[shape=coordinate] (\boxstartx,0pt |- \baposter@box@aligned nw)                           coordinate(\baposter@box@name nw);%
      }{%
        %% Fixed%
        \typeout{Fixed}%
        \setlength{\boxstarty}{\baposter@box@row\colheight}%
        \path[shape=coordinate] (\boxstartx,\colheight-\boxstarty)                                                  coordinate(\baposter@box@name nw);%
    }}%
%
    %% Lower Left Corner%
    \typeout{Lower Left}%
    \ifthenelse{\equal{\baposter@box@above}{bottom}}{%
      %% Above = Bottom%
      \typeout{Above bottom}%
      \ifthenelse{\equal{\baposter@box@below}{notset} \and \equal{\baposter@box@aligned}{notset}}{%
      \path[shape=coordinate] (\boxstartx,\boxheight)                                                              coordinate(\baposter@box@name nw);%
      }{}%
      \path[shape=coordinate] (\boxstartx+\boxwidth,0pt)                                                           coordinate(\baposter@box@name se);%
      }{\ifthenelse{\not \equal{\baposter@box@bottomaligned}{notset}}{%
        \path[shape=coordinate] (\boxstartx+\boxwidth,0pt |- \baposter@box@bottomaligned se)                       coordinate(\baposter@box@name se);%
      }{{\ifthenelse{\not \equal{\baposter@box@above}{notset}}{%
        %% Above = Node%
        \path[shape=coordinate] (\boxstartx+\boxwidth,0pt |- \baposter@box@above nw)  +(0pt,\baposter@@colspacing) coordinate(\baposter@box@name se);%
      }{%
        %% Above = notset%
        \typeout{Above=not set}%
        \ifthenelse{\equal{\baposter@box@height}{bottom}}{%
          %% height=bottom%
          \typeout{height=bottom}%
          \path[shape=coordinate] (\boxstartx+\boxwidth,0pt)                                                       coordinate(\baposter@box@name se);%
        }{ %% height=auto or fixed%
          \typeout{height=auto or fixed}%
          \path[shape=coordinate] (\baposter@box@name nw) ++(\boxwidth,-\boxheight)                                coordinate(\baposter@box@name se);%
	  }}}}}%
%
        %
    % Set coordinates relative to nw,se%
    \typeout{Fixing Coordinates}%
    \path[shape=coordinate]%
      (\baposter@box@name nw) +(0pt,-2em)                coordinate(\baposter@box@name tnw)%
      (\baposter@box@name nw |- \baposter@box@name se)   coordinate(\baposter@box@name sw)%
      (\baposter@box@name se |- \baposter@box@name nw)   coordinate(\baposter@box@name ne)%
      (\baposter@box@name ne) +(0pt,-2em)                coordinate(\baposter@box@name tne)%
%
      (\baposter@box@name nw)  +(-0.025em,0pt)           coordinate(\baposter@box@name outer nw)%
      (\baposter@box@name tnw) +(-0.025em,0pt)           coordinate(\baposter@box@name outer tnw)%
      (\baposter@box@name sw)  +(-0.025em,0pt)           coordinate(\baposter@box@name outer sw)%
%
      (\baposter@box@name ne)  +( 0.025em,0pt)           coordinate(\baposter@box@name outer ne)%
      (\baposter@box@name tne) +( 0.025em,0pt)           coordinate(\baposter@box@name outer tne)%
      (\baposter@box@name se)  +( 0.025em,0pt)           coordinate(\baposter@box@name outer se);%
%
      \ifthenelse{\equal{\baposter@headershade}{shade-lr}}{%
        \typeout{Header-Shade: Shade Left - Right}
        \tikzstyle{header colors}=[%
          color=borderColor,%
          shading=axis,%
          left color=headerColorOne,%
          right color=headerColorTwo%
          ]%
      }{\ifthenelse{\equal{\baposter@headershade}{shade-tb}}{%
        \typeout{Header-Shade: Shade Top - Bottom}
        \tikzstyle{header colors}=[%
          color=borderColor,%
          shading=axis,%
          top color=headerColorOne,%
          bottom color=headerColorTwo%
          ]%
      }{\ifthenelse{\equal{\baposter@headershade}{shade-tb-inverse}}{%
        \tikzstyle{header colors}=[%
          top color=headerColorOne!75!headerColorTwo,%
          bottom color=headerColorTwo!100!headerColorOne,%
          shading angle=20%
          ]%
          \colorlet{baposterHeaderFontColor}{white}%
      }{\ifthenelse{\equal{\baposter@headershade}{plain}}{%
        \typeout{Header-Shade: Plain}
        \tikzstyle{header colors}=[%
          color=borderColor,%
          fill=headerColorOne%
          ]%
      }{%
        \typeout{Header-Shade: Unknown Style: \baposter@headershade}
        \PackageError{baposter.cls}{Unknown header shade style \baposter@headershade}{Edit your file to choose a valid option}{}%
      }}}}%
      \typeout{Box-Shade: \baposter@boxshade}
      \ifthenelse{\equal{\baposter@boxshade}{shade-lr}}{%
        \tikzstyle{box colors}=[%
          shading=axis,%
          left color=boxColorOne,%
          right color=boxColorTwo%
          ]%
      }{%
        \ifthenelse{\equal{\baposter@boxshade}{shade-tb}}{%
          \tikzstyle{box colors}=[%
            shading=axis,%
            top color=boxColorOne,%
            bottom color=boxColorTwo%
            ]%
        }{%
          \ifthenelse{\equal{\baposter@boxshade}{plain}}{%
            \tikzstyle{box colors}=[%
              fill=boxColorOne%
              ]%
          }{%
            \ifthenelse{\equal{\baposter@boxshade}{none}}{%
              \tikzstyle{box colors}=[]%
            }{%
              \PackageError{baposter.cls}{Unknown box shade style \baposter@boxshade}{Edit your file to choose a valid option}{}%
            }%
          }%
        }%
      }%
      \tikzstyle{rc}=[rounded corners=2em];%
      \tikzstyle{src}=[rounded corners=0.5em];%
%
    \begin{scope}[line width=\baposter@linewidth]
      \typeout{Header}%
      \typeout{Header-Shape: \baposter@headershape}%
      %% Header%
      \ifthenelse  {\equal{\baposter@headershape}{rectangle}}   {%
      %%%
        \ifthenelse{\equal{\baposter@headerborder}{open}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)         -- (\baposter@box@name ne)       -- (\baposter@box@name tne);%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)         -- (\baposter@box@name ne)       -- (\baposter@box@name tne);%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{closed}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)         -- (\baposter@box@name ne)       -- (\baposter@box@name tne) -- cycle;%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)         -- (\baposter@box@name ne)       -- (\baposter@box@name tne) -- cycle;%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{none}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \fill      [style=header colors] (\baposter@box@name outer tnw)           -- (\baposter@box@name outer nw)   -- (\baposter@box@name outer ne) -- (\baposter@box@name outer tne) -- cycle;%
          }{
            \shade     [style=header colors] (\baposter@box@name outer tnw)           -- (\baposter@box@name outer nw)   -- (\baposter@box@name outer ne) -- (\baposter@box@name outer tne) -- cycle;%
          }
        }{\PackageError{baposter.cls}{Unknown header border \baposter@headerborder}{Edit your file to choose a valid option}}}}{}%
        \path (\baposter@box@name nw) +(0em,-1em) node[anchor=west,inner sep=0.4em] {\color{headerFontColor}\baposter@headerfont{##1}};%
      %%%
      }{\ifthenelse{\equal{\baposter@headershape}{small-rounded}}     {%
      %%%
        \ifthenelse{\equal{\baposter@headerborder}{open}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne);%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne);%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{closed}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filledraw [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne) -- cycle;%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne) -- cycle;%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{none}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \fill      [style=header colors] (\baposter@box@name outer tnw) {[rc]     -- (\baposter@box@name outer nw)   -- (\baposter@box@name outer ne)} -- (\baposter@box@name outer tne) -- cycle;%
          }{
            \shade     [style=header colors] (\baposter@box@name outer tnw) {[rc]     -- (\baposter@box@name outer nw)   -- (\baposter@box@name outer ne)} -- (\baposter@box@name outer tne) -- cycle;%
          }
        }{\PackageError{baposter.cls}{Unknown header border \baposter@headerborder}{Edit your file to choose a valid option}}}}{}%
        \path (\baposter@box@name nw) +(0.5\boxwidth,-1em) node[anchor=center] {\color{headerFontColor}\baposter@headerfont{##1}};%
      %%%
      }{\ifthenelse{\equal{\baposter@headershape}{roundedright}}{%
      %%%
        \ifthenelse{\equal{\baposter@headerborder}{open}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)       {[rc] -- (\baposter@box@name ne)      } -- (\baposter@box@name tne);%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)       {[rc] -- (\baposter@box@name ne)      } -- (\baposter@box@name tne);%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{closed}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)       {[rc] -- (\baposter@box@name ne)      } -- (\baposter@box@name tne) -- cycle;%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)                 -- (\baposter@box@name nw)       {[rc] -- (\baposter@box@name ne)      } -- (\baposter@box@name tne) -- cycle;%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{none}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \fill      [style=header colors] (\baposter@box@name outer tnw)           -- (\baposter@box@name outer nw) {[rc] -- (\baposter@box@name outer ne)} -- (\baposter@box@name outer tne) -- cycle;%
          }{
            \shade     [style=header colors] (\baposter@box@name outer tnw)           -- (\baposter@box@name outer nw) {[rc] -- (\baposter@box@name outer ne)} -- (\baposter@box@name outer tne) -- cycle;%
          }
        }{\PackageError{baposter.cls}{Unknown header border \baposter@headerborder}{Edit your file to choose a valid option}}}}{}%
        \path (\baposter@box@name nw) +(0em,-1em) node[anchor=west,inner sep=0.4em,text depth=0.0em] {\color{headerFontColor}\baposter@headerfont{##1}};%
      %%%
      }{\ifthenelse{\equal{\baposter@headershape}{roundedleft}}{%
      %%%
        \ifthenelse{\equal{\baposter@headerborder}{open}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors,color=borderColor] (\baposter@box@name tnw)            {[rc]-- (\baposter@box@name nw)       }     -- (\baposter@box@name ne)       -- (\baposter@box@name tne);%
          }{
            \shadedraw [style=header colors,color=borderColor] (\baposter@box@name tnw)            {[rc]-- (\baposter@box@name nw)       }     -- (\baposter@box@name ne)       -- (\baposter@box@name tne);%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{closed}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors,color=borderColor] (\baposter@box@name tnw)            {[rc]-- (\baposter@box@name nw)       }     -- (\baposter@box@name ne)       -- (\baposter@box@name tne) -- cycle;%
          }{
            \shadedraw [style=header colors,color=borderColor] (\baposter@box@name tnw)            {[rc]-- (\baposter@box@name nw)       }     -- (\baposter@box@name ne)       -- (\baposter@box@name tne) -- cycle;%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{none}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \fill      [style=header colors,color=borderColor] (\baposter@box@name outer tnw)      {[rc]-- (\baposter@box@name outer nw) }     -- (\baposter@box@name outer ne) -- (\baposter@box@name outer tne) -- cycle;%
          }{
            \shade     [style=header colors,color=borderColor] (\baposter@box@name outer tnw)      {[rc]-- (\baposter@box@name outer nw) }     -- (\baposter@box@name outer ne) -- (\baposter@box@name outer tne) -- cycle;%
          }
        }{\PackageError{baposter.cls}{Unknown header border \baposter@headerborder}{Edit your file to choose a valid option}}}}{}%
        \path (\baposter@box@name nw) +(0em,-1em) node[anchor=west,inner sep=0.4em] {\color{headerFontColor}\baposter@headerfont{##1}};%
      %%%
      }{\ifthenelse{\equal{\baposter@headershape}{rounded}}     {%
      %%%
        \ifthenelse{\equal{\baposter@headerborder}{open}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne);%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne);%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{closed}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \filldraw  [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne) -- cycle;%
          }{
            \shadedraw [style=header colors] (\baposter@box@name tnw)       {[rc]     -- (\baposter@box@name nw)         -- (\baposter@box@name ne)      } -- (\baposter@box@name tne) -- cycle;%
          }
        }{\ifthenelse{\equal{\baposter@headerborder}{none}}{%
          \ifthenelse{\equal{\baposter@headershade}{plain}}{
            \fill      [style=header colors] (\baposter@box@name outer tnw) {[rc]     -- (\baposter@box@name outer nw)   -- (\baposter@box@name outer ne)} -- (\baposter@box@name outer tne) -- cycle;%
          }{
            \shade     [style=header colors] (\baposter@box@name outer tnw) {[rc]     -- (\baposter@box@name outer nw)   -- (\baposter@box@name outer ne)} -- (\baposter@box@name outer tne) -- cycle;%
          }
        }{\PackageError{baposter.cls}{Unknown header border \baposter@headerborder}{Edit your file to choose a valid option}}}}{}%
        \path (\baposter@box@name nw) +(0.5\boxwidth,-1em) node[anchor=center] {\color{headerFontColor}\baposter@headerfont{##1}};%
      %%%
      }{%
        \typeout{Unknown header style \baposter@headershape}
        \PackageError{baposter.cls}{Unknown header style \baposter@headershape}{Edit your file to choose a valid option}{}%
      }}}}}%
  %
      \typeout{Sidebars}%
      %% Sidebars%
      \ifthenelse  {\equal{\baposter@textborder}{none}}    {%
      }{\ifthenelse{\equal{\baposter@textborder}{bars}}{%
        \begin{scope}[color=borderColor]%
          \draw (\baposter@box@name tne) -- (\baposter@box@name se);%
          \draw (\baposter@box@name tnw) -- (\baposter@box@name sw);%
        \end{scope}%
      }{\ifthenelse{\equal{\baposter@textborder}{coils}}{%
        \begin{scope}[color=borderColor,segment amplitude=0.35em,segment length=0.4em,snake=coil]%
          \draw (\baposter@box@name tne) -- (\baposter@box@name se);%
          \draw (\baposter@box@name tnw) -- (\baposter@box@name sw);%
        \end{scope}%
      }{\ifthenelse{\equal{\baposter@textborder}{triangles}}{%
        \begin{scope}[color=borderColor,segment amplitude=0.2em,segment length=0.4em,snake=triangles]%
          \draw [snake=triangles] (\baposter@box@name tne) -- (\baposter@box@name se);%
          \draw [snake=triangles] (\baposter@box@name tnw) -- (\baposter@box@name sw);%
        \end{scope}%
      }{\ifthenelse{\equal{\baposter@textborder}{rectangle}}{%
        \begin{scope}[color=borderColor]%
        \ifthenelse{\equal{\baposter@boxshade}{none}}{%
        }{
          \fill[box colors] (\baposter@box@name tnw) -- (\baposter@box@name sw) -- (\baposter@box@name se) -- (\baposter@box@name tne);%
        }
        \draw[color=borderColor] (\baposter@box@name tnw) -- (\baposter@box@name sw) -- (\baposter@box@name se) -- (\baposter@box@name tne);%
        \end{scope}%
      }{\ifthenelse{\equal{\baposter@textborder}{rounded}}  {%
        \ifthenelse{\equal{\baposter@boxshade}{none}}{%
        }{
          \fill[box colors,rc] (\baposter@box@name tnw) -- (\baposter@box@name sw) -- (\baposter@box@name se) -- (\baposter@box@name tne);%
        }
        \draw[color=borderColor,rc] (\baposter@box@name tnw) -- (\baposter@box@name sw) -- (\baposter@box@name se) -- (\baposter@box@name tne);%
      }{\ifthenelse{\equal{\baposter@textborder}{roundedleft}}  {%
        \ifthenelse{\equal{\baposter@boxshade}{none}}{%
        }{
          \fill[box colors] (\baposter@box@name tnw) {[rc]-- (\baposter@box@name sw)} -- (\baposter@box@name se) -- (\baposter@box@name tne) -- cycle;%
        }
        \draw[color=borderColor,box colors] (\baposter@box@name tnw) {[rc]-- (\baposter@box@name sw)} -- (\baposter@box@name se) -- (\baposter@box@name tne);%
      }{\ifthenelse{\equal{\baposter@textborder}{faded}}{%
        \tikzstyle{west faded bar}=[color=borderColor]%
        \tikzstyle{east faded bar}=[color=borderColor]%
        \begin{scope}[west faded bar,x={(\baposter@box@name tnw)},y={(\baposter@box@name sw)}]%
          \draw [draw opacity=1.0,west faded bar] (1.0,0.0) -- (0.9,0.1);%
          \draw [draw opacity=0.9] (0.9,0.1) -- (0.8,0.2);%
          \draw [draw opacity=0.8] (0.8,0.2) -- (0.7,0.3);%
          \draw [draw opacity=0.7] (0.7,0.3) -- (0.6,0.4);%
          \draw [draw opacity=0.6] (0.6,0.4) -- (0.5,0.5);%
          \draw [draw opacity=0.5] (0.5,0.5) -- (0.4,0.6);%
          \draw [draw opacity=0.4] (0.4,0.6) -- (0.3,0.7);%
          \draw [draw opacity=0.3] (0.3,0.7) -- (0.2,0.8);%
          \draw [draw opacity=0.2] (0.2,0.8) -- (0.1,0.9);%
          \draw [draw opacity=0.1] (0.1,0.9) -- (0.0,1.0);%
        \end{scope}%
  %
        \begin{scope}[east faded bar,x={(\baposter@box@name tne)},y={(\baposter@box@name se)}]%
          \draw [draw opacity=1.0] (1.0,0.0) -- (0.9,0.1);%
          \draw [draw opacity=0.9] (0.9,0.1) -- (0.8,0.2);%
          \draw [draw opacity=0.8] (0.8,0.2) -- (0.7,0.3);%
          \draw [draw opacity=0.7] (0.7,0.3) -- (0.6,0.4);%
          \draw [draw opacity=0.6] (0.6,0.4) -- (0.5,0.5);%
          \draw [draw opacity=0.5] (0.5,0.5) -- (0.4,0.6);%
          \draw [draw opacity=0.4] (0.4,0.6) -- (0.3,0.7);%
          \draw [draw opacity=0.3] (0.3,0.7) -- (0.2,0.8);%
          \draw [draw opacity=0.2] (0.2,0.8) -- (0.1,0.9);%
          \draw [draw opacity=0.1] (0.1,0.9) -- (0.0,1.0);%
        \end{scope}%
      }{\ifthenelse{\equal{\baposter@textborder}{rounded-small}}  {%
        \begin{scope}[color=borderColor,src]%
          \draw[color=borderColor,box colors] (\baposter@box@name tnw) -- (\baposter@box@name sw) -- (\baposter@box@name se) -- (\baposter@box@name tne);%
        \end{scope}%
      }{%
        \PackageError{baposter.cls}{Unknown text-box style \baposter@textborder}{Edit your file to choose a valid option}}{}
      }}}}}}}}%
  %
      \typeout{Drawing Text}%
      %% Text Box%
      \path (\baposter@box@name tnw) node(text) [anchor=north west,outer sep=-0.000em,text width=\boxwidth-1em,inner sep=0.5em,text justified] {\usebox{\baposter@content}};%
    \end{scope}
  }%
%
  %% Background%
  \baposterShadedBG%
  \hspace{-1.5em}%
  \begin{tikzpicture}[inner sep=0pt,outer sep=0pt,line width=0.05em]%
    \useasboundingbox (0em,0em) rectangle(\textwidth,\textheight);%
    \path[shape=coordinate]%
      (0pt,\colheight) coordinate(north west) (\textwidth,\colheight) coordinate(north east)%
      (0pt,0pt) coordinate(south west)        (\textwidth,0pt) coordinate(south east);%
%
    \ifthenelse{\equal{\baposter@eyecatcher}{no}}{ % Has no eye catcher
      \setbox\baposter@titleimage@left=\hbox{}%
    }{ % Has eye catcher%
      \typeout{Eyecatcher found!}
      \setbox\baposter@titleimage@left=\hbox{#2}%
    }%
    \setlength{\baposter@titleimage@left@width}{\wd\baposter@titleimage@left}%
    \setbox\baposter@titleimage@right=\hbox{#5}%
    \setlength{\baposter@titleimage@right@width}{\wd\baposter@titleimage@right}%
    \setlength{\baposter@titleimage@textwidth}{\textwidth}%
    \addtolength{\baposter@titleimage@textwidth}{-\baposter@titleimage@left@width}%
    \addtolength{\baposter@titleimage@textwidth}{-\baposter@titleimage@right@width}%

    \typeout{#3}
    %
    %
    %      % Draw Header%
    \draw (north west) +(0em,1em+0.5\headerheight) node(image)[anchor=west]   { {\usebox{\baposter@titleimage@left }} };%
    \draw (north east) +(0em,1em+0.5\headerheight) node(logo) [anchor=east]   { {\usebox{\baposter@titleimage@right}} };%
    \ifthenelse{\equal{\baposter@eyecatcher}{no}}{ % Has no eye catcher
      \draw (image.east) node(title)[anchor=west]  { {\begin{minipage}{\baposter@titleimage@textwidth}{\bf\Huge #3}\\{\Large #4}\end{minipage}} };%
    }{ % Has eye catcher%
      \draw (image.east) node(title)[anchor=west,text width=\baposter@titleimage@textwidth]{%
        \begin{minipage}{\baposter@titleimage@textwidth}%
          \begin{center}%
          \textbf{\Huge #3}\\%
          {\Large #4}%
          \end{center}%
        \end{minipage}
      };%
    }%
  }%
% The body
  {%
    % The end, draw gridlines if neccesary
    \ifthenelse{\equal{\baposter@grid}{yes}}{ % TODO: Understand boolean options declaration%
    \draw[draw=green,draw opacity=0.7] %
      (0\colwidth,0pt)  -- (0\colwidth,\colheight)%
      (1\colwidth,0pt)  -- (1\colwidth,\colheight)%
      (1\colwidth+1\baposter@@colspacing,0pt)  -- (1\colwidth+1\baposter@@colspacing,\colheight)%
      (2\colwidth+1\baposter@@colspacing,0pt)  -- (2\colwidth+1\baposter@@colspacing,\colheight)%
      (2\colwidth+2\baposter@@colspacing,0pt)  -- (2\colwidth+2\baposter@@colspacing,\colheight)%
      (3\colwidth+2\baposter@@colspacing,0pt)  -- (3\colwidth+2\baposter@@colspacing,\colheight)%
      (3\colwidth+3\baposter@@colspacing,0pt)  -- (3\colwidth+3\baposter@@colspacing,\colheight)%
      (4\colwidth+3\baposter@@colspacing,0pt)  -- (4\colwidth+3\baposter@@colspacing,\colheight)%
  %
      (0pt,0.0\colheight)  -- (\textwidth,0.0\colheight) node[anchor=west] {1.0}%
      (0pt,0.1\colheight)  -- (\textwidth,0.1\colheight) node[anchor=west] {0.9}%
      (0pt,0.2\colheight)  -- (\textwidth,0.2\colheight) node[anchor=west] {0.8}%
      (0pt,0.3\colheight)  -- (\textwidth,0.3\colheight) node[anchor=west] {0.7}%
      (0pt,0.4\colheight)  -- (\textwidth,0.4\colheight) node[anchor=west] {0.6}%
      (0pt,0.5\colheight)  -- (\textwidth,0.5\colheight) node[anchor=west] {0.5}%
      (0pt,0.6\colheight)  -- (\textwidth,0.6\colheight) node[anchor=west] {0.4}%
      (0pt,0.7\colheight)  -- (\textwidth,0.7\colheight) node[anchor=west] {0.3}%
      (0pt,0.8\colheight)  -- (\textwidth,0.8\colheight) node[anchor=west] {0.2}%
      (0pt,0.9\colheight)  -- (\textwidth,0.9\colheight) node[anchor=west] {0.1}%
      (0pt,1.0\colheight)  -- (\textwidth,1.0\colheight) node[anchor=west] {0.0};%
    }{%
    }
  \end{tikzpicture}%
 % \xkvview{}
 \par
  }%
