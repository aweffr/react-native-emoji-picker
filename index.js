import React, {Component} from 'react'

import {
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
  FlatList,
  Dimensions,
  PixelRatio
} from 'react-native'
import PropTypes from 'prop-types';
import emoji from 'emoji-datasource';
import {groupBy, orderBy, includes} from 'lodash/collection';
import {mapValues} from 'lodash/object'

//polyfil for android
require('string.fromcodepoint');

let fontScale = PixelRatio.getFontScale();
let pixelRatio = PixelRatio.get();
const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;
const defaultPixel = 2;
const w2 = 750 / defaultPixel;
const h2 = 1334 / defaultPixel;
const scale = Math.min(deviceHeight / h2, deviceWidth / w2);

function scaleSize(size: number) {

  size = Math.round(size * scale + 0.5);
  return size / defaultPixel;
}

function setSpText(size: number) {
  size = Math.round((size * scale + 0.5) * pixelRatio / fontScale);
  return size / defaultPixel;
}

// i dont understand ANY of this but there's somethign called codepoints and surrogate pairs
// and this converts utf16 to a charachter in javascript. see more here:
//https://mathiasbynens.be/notes/javascript-unicode
//https://mathiasbynens.be/notes/javascript-escapes#unicode-code-point
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint
const charFromUtf16 = utf16 => String.fromCodePoint(...utf16.split('-').map(u => '0x' + u));
const charFromEmojiObj = obj => charFromUtf16(obj.unified);
const blacklistedEmojis = ['white_frowning_face', 'keycap_star', 'eject'];

const isAndroid = (Platform.OS === 'android');
const letterSpacing = scaleSize(20);
const defaultEmojiSize = setSpText(17);
const padding = scaleSize(10);
const filteredEmojis = emoji.filter(e => isAndroid ? !!e.google : !includes(blacklistedEmojis, e.short_name));
// sort emojis by 'sort_order' then group them into categories
const groupedAndSorted = groupBy(orderBy(filteredEmojis, 'sort_order'), 'category');
// convert the emoji object to a character
const emojisByCategory = mapValues(groupedAndSorted, group => group.map(charFromEmojiObj));

const CATEGORIES = ['People', 'Nature', 'Foods', 'Activity', 'Places', 'Objects', 'Symbols', 'Flags'];


class EmojiPicker extends React.Component {
  state = {
    categories: CATEGORIES.slice(0, 1),
    isMounted: false
  };

  componentWillMount() {
    setTimeout(() => {
      this.setState({
        isMounted: true
      })
    }, 0)
  }

  componentWillUnmount() {
    clearTimeout(this._timeout)
  }

  loadNextCategory() {
    if (this.state.categories.length < CATEGORIES.length) {
      this.setState({categories: CATEGORIES.slice(0, this.state.categories.length + 1)})
    }
  }

  renderCategory = (e) => {
    let size = this.props.emojiSize || defaultEmojiSize;
    let style = {
      width: (deviceWidth - padding * 2) / 8,
      fontSize: size,
      color: 'black',
      textAlign: 'center',
      // padding: padding,
      flexDirection: 'row',
      flexWrap: 'wrap'

    };

    return (
      <Text style={style}
            onPress={() => this.props.onEmojiSelected(e.item)}>
        {e.item}
      </Text>
    )
  };

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        {
          this.state.isMounted &&
          <FlatList
            horizontal={false}
            showsVerticalScrollIndicator={false}
            numColumns={9}
            data={emojisByCategory['People']}
            renderItem={this.renderCategory}
            keyExtractor={(item, index) => index.toString()}
            initialNumToRender={15}
          />
        }
      </View>
    )
  }
}

const EmojiOverlay = props => (
  <View style={[styles.absolute, props.visible ? styles.visible : styles.hidden]}>
    <TouchableOpacity style={styles.absolute} onPress={props.onTapOutside}>
      <View style={styles.background}/>
    </TouchableOpacity>
    {props.visible ? <EmojiPicker {...props}/> : null}
  </View>
);

let styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: padding
  },
  absolute: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  visible: {
    top: 0,
    flex: 1,
    justifyContent: 'center',
  },
  hidden: {
    top: 1000,
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: 'grey',
    opacity: 0.5,
  },
});

EmojiPicker.propTypes = {
  onEmojiSelected: PropTypes.func.isRequired,
};

export default EmojiPicker;
export {EmojiOverlay};

