exports.id = 307;
exports.ids = [307];
exports.modules = {

/***/ 4873:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 1232, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 831, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 2987, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 6926, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 4282, 23))

/***/ }),

/***/ 4588:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 6173, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 954, 23))

/***/ }),

/***/ 3855:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ RootLayout),
  metadata: () => (/* binding */ metadata)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(6786);
// EXTERNAL MODULE: ./node_modules/next/font/google/target.css?{"path":"app\\layout.js","import":"Inter","arguments":[{"subsets":["latin"]}],"variableName":"inter"}
var target_path_app_layout_js_import_Inter_arguments_subsets_latin_variableName_inter_ = __webpack_require__(4010);
var target_path_app_layout_js_import_Inter_arguments_subsets_latin_variableName_inter_default = /*#__PURE__*/__webpack_require__.n(target_path_app_layout_js_import_Inter_arguments_subsets_latin_variableName_inter_);
// EXTERNAL MODULE: ./app/globals.css
var globals = __webpack_require__(7272);
// EXTERNAL MODULE: external "next/dist/lib/import-next-warning"
var import_next_warning_ = __webpack_require__(3160);
// EXTERNAL MODULE: ./node_modules/next/script.js
var script = __webpack_require__(4862);
var script_default = /*#__PURE__*/__webpack_require__.n(script);
// EXTERNAL MODULE: ./node_modules/next/link.js
var next_link = __webpack_require__(5124);
var link_default = /*#__PURE__*/__webpack_require__.n(next_link);
;// CONCATENATED MODULE: ./src/Header.tsx


function Header() {
    return /*#__PURE__*/ jsx_runtime_.jsx("header", {
        id: "header",
        className: "navbarScroll w-100 headerNav headerTop",
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "container d-flex align-items-center justify-content-between",
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "",
                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                        className: "p-0 d-flex align-items-center",
                        href: "/",
                        children: /*#__PURE__*/ jsx_runtime_.jsx("img", {
                            className: "logo-top",
                            src: "image/Logo.png"
                        })
                    })
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("button", {
                    className: "navbar-toggler mobile-nav-toggle border-0 p-0 d-lg-none",
                    type: "button",
                    "data-toggle": "collapse",
                    "data-target": "#navbarSupportedContent",
                    "aria-controls": "navbarSupportedContent",
                    "aria-expanded": "false",
                    "aria-label": "Toggle navigation",
                    children: [
                        " ",
                        /*#__PURE__*/ jsx_runtime_.jsx("i", {
                            className: "fa fa-bars text-dark",
                            "aria-hidden": "true"
                        }),
                        " "
                    ]
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "main-nav d-none d-lg-flex",
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx("button", {
                            className: "navbar-toggler mobile-nav-toggle border-0 p-0 d-lg-none mobileMenuClose",
                            type: "button",
                            "data-toggle": "collapse",
                            "data-target": "#navbarSupportedContent",
                            "aria-controls": "navbarSupportedContent",
                            "aria-expanded": "false",
                            "aria-label": "Toggle navigation",
                            children: /*#__PURE__*/ jsx_runtime_.jsx("img", {
                                src: "image/close.png",
                                alt: ""
                            })
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                            className: " d-lg-flex align-items-lg-center float-lg-left",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                        className: "scrollLink active",
                                        href: "/",
                                        children: "Home"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                        className: "scrollLink",
                                        href: "/about",
                                        children: "About"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                        className: "scrollLink",
                                        href: "/product",
                                        children: "Products"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                        className: "scrollLink",
                                        href: "/contact",
                                        children: "Contact"
                                    })
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}

;// CONCATENATED MODULE: ./src/Footer.tsx


function Footer() {
    return /*#__PURE__*/ jsx_runtime_.jsx("footer", {
        className: "footer",
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "container",
            children: [
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "row footerSection defaultPaddingTB",
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "col-xl-5 col-lg-6",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                    className: "p-0 d-inline-block",
                                    href: "index.html",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("img", {
                                        className: "logo-top mb-3",
                                        src: "image/Logo.png"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                    className: "mb-3",
                                    children: "Samridhi Frames empower you to embark on a journey of prosperity and growth. These exquisite frames serve as constant reminders of your limitless potential, igniting the spark of confidence within you. All rights reserved. J2D FASHIONS PRIVATE LIMITED"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                    className: "row mt-5",
                                    children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "col-lg-6 col-md-6",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("h6", {
                                                children: "SEND A MESSEGE"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                                                className: "mt-1",
                                                children: "support@samriddhiframes.com"
                                            })
                                        ]
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            className: "col-xl-5 col-lg-6 ms-auto mt-4 mt-md-0",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "row pt-3",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                        className: "col-lg-6 col-6 mt-4",
                                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                                            className: "list-unstyled",
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/",
                                                        children: "Home"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/about",
                                                        children: "About"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/contact",
                                                        children: "Contact"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/products",
                                                        children: "Products"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/privacy",
                                                        children: "Privacy Policy"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/terms",
                                                        children: "Terms & Conditions"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/cancellation-and-refund-policy",
                                                        children: "Return & Refund Policy"
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
                                                        href: "/shipping-policy",
                                                        children: "Shipping & Delivery"
                                                    })
                                                })
                                            ]
                                        })
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "col-lg-6 col-6 mt-4",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("h5", {
                                                children: "Follow us at"
                                            }),
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                                                className: "list-unstyled footerUser mt-2",
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                                            target: "_blank",
                                                            href: "https://www.facebook.com/SamriddhiFrames",
                                                            className: "facebook",
                                                            children: /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                                className: "fa fa-facebook"
                                                            })
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                                            target: "_blank",
                                                            href: "https://www.instagram.com/samriddhi_frames/",
                                                            className: "instagram",
                                                            children: /*#__PURE__*/ jsx_runtime_.jsx("i", {
                                                                className: "fa fa-instagram"
                                                            })
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "row py-3 border-top footerBottom",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "col-xl-12 col-lg-12",
                        children: /*#__PURE__*/ jsx_runtime_.jsx("p", {
                            className: "text-center text-lg-start",
                            children: "Copyright \xa92023 J2D FASHIONS PRIVATE LIMITED. All rights reserved."
                        })
                    })
                })
            ]
        })
    });
}

;// CONCATENATED MODULE: ./app/layout.js







const metadata = {
    title: "Samriddhi Frame",
    description: "Generated by create next app"
};
function RootLayout({ children }) {
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("head", {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        charSet: "utf-8"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1, shrink-to-fit=no"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "keywords"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("title", {
                        children: "Home"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "icon",
                        href: "img/rkInputIcon.png"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        type: "text/css",
                        href: "css/bootstrap.min.css"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        type: "text/css",
                        href: "css/style.css"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        type: "text/css",
                        href: "css/common.css"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        type: "text/css",
                        href: "css/responsive.css"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        href: "css/animate.css"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "stylesheet",
                        type: "text/css",
                        href: "css/swiper-bundle.min.css"
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("body", {
                className: (target_path_app_layout_js_import_Inter_arguments_subsets_latin_variableName_inter_default()).className,
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(Header, {}),
                    children,
                    /*#__PURE__*/ jsx_runtime_.jsx(Footer, {})
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/jquery.min.js"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/bootstrap.min.js"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/particles.min.js"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/swiper-bundle.min.js"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/custom.js"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/mobile-nav.js"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx((script_default()), {
                id: "scriptAfterInteractive",
                type: "text/javascript",
                src: "js/wow.js"
            })
        ]
    });
}


/***/ }),

/***/ 7481:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(85);
/* harmony import */ var next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0__);
  

  /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((props) => {
    const imageData = {"type":"image/x-icon","sizes":"any"}
    const imageUrl = (0,next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0__.fillMetadataSegment)(".", props.params, "favicon.ico")

    return [{
      ...imageData,
      url: imageUrl + "",
    }]
  });

/***/ }),

/***/ 7272:
/***/ (() => {



/***/ })

};
;