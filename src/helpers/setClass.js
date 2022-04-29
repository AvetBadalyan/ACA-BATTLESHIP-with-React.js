import React from 'react'

export default function setClass(condition, class1, class2="") {
  if (condition) {
      return class1;
  } else {
      return class2;
  }
}
