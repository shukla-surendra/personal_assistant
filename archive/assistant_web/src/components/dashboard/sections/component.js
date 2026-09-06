import React from "react"
import ReactDOM from "react-dom"
import { cx, css } from "@emotion/css"
import { BsTypeBold, BsTypeUnderline, BsTypeItalic, BsCode } from "react-icons/bs";
import { MdLooksOne, MdLooksTwo, MdFormatQuote, MdFormatListNumbered, MdFormatListBulleted, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdFormatAlignJustify } from 'react-icons/md'

export const Button = React.forwardRef(
  ({ className, active, reversed, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed
            ? active
              ? "white"
              : "#aaa"
            : active
              ? "black"
              : "#ccc"};
        `
      )}
    />
  )
)

export const EditorValue = React.forwardRef(
  ({ className, value, ...props }, ref) => {
    const textLines = value.document.nodes
      .map(node => node.text)
      .toArray()
      .join("\n")
    return (
      <div
        ref={ref}
        {...props}
        className={cx(
          className,
          css`
            margin: 30px -20px 0;
          `
        )}
      >
        <div
          className={css`
            font-size: 14px;
            padding: 5px 20px;
            color: #404040;
            border-top: 2px solid #eeeeee;
            background: #f8f8f8;
          `}
        >
          Slate's value as text
        </div>
        <div
          className={css`
            color: #404040;
            font: 12px monospace;
            white-space: pre-wrap;
            padding: 10px 20px;
            div {
              margin: 0 0 0.5em;
            }
          `}
        >
          {textLines}
        </div>
      </div>
    )
  }
)

export const FtIcon = React.forwardRef(({ className, ...props }, ref) => {

  let IconComponent = null
  const { iconName } = props
  switch (iconName) {
    case 'format_bold':
      IconComponent = BsTypeBold; // replace with your own BoldIcon component
      break;
    case 'format_italic':
      IconComponent = BsTypeItalic; // replace with your own ItalicIcon component
      break;
    case 'format_underlined':
      IconComponent = BsTypeUnderline; // replace with your own UnderlineIcon component
      break;
    case 'code':
      IconComponent = BsCode; // replace with your own CodeIcon component
      break;
    case 'looks_one':
      IconComponent = MdLooksOne; // replace with your own Heading1Icon component
      break;
    case 'looks_two':
      IconComponent = MdLooksTwo; // replace with your own Heading2Icon component
      break;
    case 'format_quote':
      IconComponent = MdFormatQuote; // replace with your own BlockQuoteIcon component
      break;
    case 'format_list_numbered':
      IconComponent = MdFormatListNumbered; // replace with your own NumberedListIcon component
      break;
    case 'format_list_bulleted':
      IconComponent = MdFormatListBulleted; // replace with your own BulletedListIcon component
      break;
    case 'format_align_left':
      IconComponent = MdFormatAlignLeft; // replace with your own TextAlignLeftIcon component
      break;
    case 'format_align_center':
      IconComponent = MdFormatAlignCenter; // replace with your own TextAlignCenterIcon component
      break;
    case 'format_align_right':
      IconComponent = MdFormatAlignRight; // replace with your own TextAlignRightIcon component
      break;
    case 'format_align_justify':
      IconComponent = MdFormatAlignJustify; // replace with your own TextAlignJustifyIcon component
      break;
    default:
      IconComponent = BsTypeItalic; // replace with your own DefaultIcon component
  }
  return (<IconComponent></IconComponent>)
});


export const Instruction = React.forwardRef(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        white-space: pre-wrap;
        margin: 0 -20px 10px;
        padding: 10px 20px;
        font-size: 14px;
        background: #f8f8e8;
      `
    )}
  />
))

export const Menu = React.forwardRef(({ className, ...props }, ref) => (
  <div
    {...props}
    data-test-id="menu"
    ref={ref}
    className={cx(
      className,
      css`
        & > * {
          display: inline-block;
        }

        & > * + * {
          margin-left: 15px;
        }
      `
    )}
  />
))

export const Portal = ({ children }) => {
  return typeof document === "object"
    ? ReactDOM.createPortal(children, document.body)
    : null
}

export const Toolbar = React.forwardRef(({ className, ...props }, ref) => (
  <Menu
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        position: relative;
        padding: 1px 18px 17px;
        margin: 0 -20px;
        border-bottom: 2px solid #eee;
        margin-bottom: 20px;
      `
    )}
  />
))
