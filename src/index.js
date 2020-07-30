/**
 * @author Luís Mestre <https://github.com/LMestre14>
 */
import React, { Component } from 'react';
import { Text, View, FlatList, Animated, Easing, Image, TouchableWithoutFeedback, ActivityIndicator, Dimensions } from 'react-native';
import Styles, { width, height, EXTRA_WIDTH } from './styles';

import { LongPressGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';

export { default as ImageWrapper } from './imageWrapper';
import ImageWrapper from './imageWrapper';
import { Video } from 'expo-av';


export default class TimedSlideshow extends Component {

    static defaultProps = {
		items: [],
		duration: 5000,
        index: 0,
        extraSpacing: EXTRA_WIDTH,
        fullWidth: false,
        progressBarColor: null,
        showProgressBar: true,
        slideDirection: 'even',
        progressBarDirection: 'middle',
        footerStyle: null,
        titleStyle: null,
        textStyle: null,
        renderItem: null,
        renderFooter: null,
        renderIcon: null,
        loop: true,
        onClose: null,
    }

    
    
    constructor(props) {
        super(props);

        this.state = {
            index: props.index,
            layoutWidth: width,
            loaded: false,
            timer: new Animated.Value(0),
            paused: false
        };

        this.snapToNext = this.snapToNext.bind(this);
        this.snapToBack = this.snapToBack.bind(this);
        this.onLayout = this.onLayout.bind(this);
        this.renderItem = this.renderItem.bind(this);
        this.onClose = this.onClose.bind(this);


        this.videoRef = React.createRef()
    }

    componentDidMount() {
        // this.animation();
    }

    animation() {
        const { index } = this.state;
        let { duration, items } = this.props;

        if(!!items[index] && !isNaN(items[index].duration)) duration = items[index].duration;
        return Animated.timing(this.state.timer, {
            toValue: 1,
            easing: Easing.ease,
            useNativeDriver: true,
            duration,
        }).start(({ finished }) => finished && this.snapToNext());
    }

    snapToNext() {
        const { index, timer } = this.state;
        let { items, loop } = this.props;
        let newIndex;
        if (index === items.length - 1) {
            newIndex = 0;
        } else {
            newIndex = (index + 1) % items.length;
        }


        timer.stopAnimation(() => {
            if (!loop && newIndex === 0) {
                // we reached the start again, stop the loop
            }
            else {
                this.slideShow.scrollToIndex({ animated: true, index: newIndex });
                this.setState({ timer: new Animated.Value(0), index: newIndex }, () => {
                    this.animation();
                });
            }
        });
    }

    snapToBack() {
        const { index, timer } = this.state;
        let { items, loop } = this.props;
        let newIndex;
        if (index > 0) {
            newIndex = (index - 1) % items.length;
        } else {
            newIndex = items.length -1;
        }

        timer.stopAnimation(() => {
            if (!loop && newIndex === 0) {
                // we reached the start again, stop the loop
            }
            else {
                this.slideShow.scrollToIndex({ animated: true, index: newIndex });
                this.setState({ timer: new Animated.Value(0), index: newIndex }, () => {
                    this.animation();
                });
            }
        });
    }

    onLayout({ nativeEvent: { layout: { x, y, width, height }}}) {
        try {
            this.setState({ layoutWidth: width, loaded: true }, () => {
                this.animation();
            });
        } catch(err) {
            this.setState({ loaded: true }, () => {
                this.animation();
            });
        }
    }

    renderItem({ item, index }) {
        let { duration, extraSpacing, fullWidth, slideDirection, renderItem, loop } = this.props;
        const { index: focusedIndex, layoutWidth, timer } = this.state;

        if(typeof renderItem == 'function') return renderItem({ item, index, focusedIndex });

        if(!isNaN(item.duration)) duration = item.duration;

        if(!isNaN(item.extraSpacing)) extraSpacing = item.extraSpacing;

        if(!!item.direction) slideDirection = item.direction;

        if(item.fullWidth != void 0) fullWidth = !!item.fullWidth;

        
        var height = Dimensions.get('window').height; //full height
        
        if (item.type === 'image' || !item.type) {
            return (
                
                <LongPressGestureHandler
                    onHandlerStateChange={({ nativeEvent }) => {
                        if (nativeEvent.state === 4) {
                            timer.stopAnimation(() => {
                            });
                        } else if (nativeEvent.state === 5) {
                            this.animation();
                        }
                    }}
                minDurationMs={250}>
                    <View>
                    <TapGestureHandler numberOfTaps={2}
                    onHandlerStateChange={({ nativeEvent }) => {
                        if ((nativeEvent.absoluteX > 0) && (nativeEvent.absoluteX < 50)) {
                            this.snapToBack()
                        } else if((nativeEvent.absoluteX > 300)) {
                            this.snapToNext()
                        }
                    }}>
                        <View>
                            {/* <ImageWrapper
                                uri={item.uri}
                                index={index}
                                duration={duration}
                                fullWidth={fullWidth}
                                focusedIndex={focusedIndex}
                                extraSpacing={extraSpacing}
                                direction={slideDirection}
                                layoutWidth={layoutWidth}
                            /> */}
                            <Image
                                style={{ width, height }}
                                source={{uri: item.uri}}
                            />
                        </View>
                        </TapGestureHandler>
                    </View>
                </LongPressGestureHandler>
            )
        } else if (item.type === 'video') {
            return (
                <LongPressGestureHandler
                    onHandlerStateChange={({ nativeEvent }) => {
                        if (nativeEvent.state === 4) {
                            this.setState({paused: true});
                            timer.stopAnimation(() => {
                            });
                        } else if (nativeEvent.state === 5) {
                            this.animation();
                            this.setState({paused: false});
                        }
                    }}
                minDurationMs={250}>
                    <View>
                    <TapGestureHandler numberOfTaps={2}
                    onHandlerStateChange={({ nativeEvent }) => {
                        if ((nativeEvent.absoluteX > 0) && (nativeEvent.absoluteX < 50)) {
                            this.snapToBack()
                        } else if((nativeEvent.absoluteX > 300)) {
                            this.snapToNext()
                        }
                    }}>
                        <View>
                            <Video
                                ref={this.videoRef}
                                source={{ uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }}
                                rate={1.0}
                                volume={1.0}
                                isMuted={false}
                                resizeMode="cover"
                                shouldPlay={!this.state.paused}
                                style={{ width, height }}
                            />
                        </View>
                        </TapGestureHandler>
                    </View>
                </LongPressGestureHandler>
            )
        }
    }
    

    renderProgressBar() {
        const { showProgressBar, progressBarDirection, progressBarColor } = this.props;
        const { layoutWidth } = this.state;
        if(!showProgressBar) return null;

        let animation = { transform: [{scaleX: this.state.timer}] };

        if(progressBarDirection === 'fromLeft' || progressBarDirection === 'fromRight') {
            // Footer container as a width of 100% with paddingHorizontal of 7.5%
            let initialValue = layoutWidth * 0.85;

            if(progressBarDirection === 'fromLeft') initialValue *= -1;

            const translateX = this.state.timer.interpolate({
                inputRange: [0, 1],
                outputRange: [initialValue, 0],
                extrapolate: 'clamp',
            });

            animation.transform = [{ translateX }];
        }

        if (progressBarColor) animation.backgroundColor = progressBarColor;

        return (
            <View style={Styles.progressBarContainer}>
                <Animated.View style={[Styles.progressBar, animation]} />
            </View>
        );
    }

    renderIcon() {
        const { renderIcon } = this.props;

        if(typeof renderIcon == 'function') return renderIcon({ snapToNext: this.snapToNext });

        return (
            <TouchableWithoutFeedback onPress={this.snapToNext}>
                <Image source={require('./arrow.png')} style={Styles.arrowImg} />
            </TouchableWithoutFeedback>
        )
    }

    onClose() {
        const { onClose } = this.props;
        const { index } = this.state;
        if(typeof onClose == 'function') onClose(index);
    }

    renderCloseIcon() {
        const { renderCloseIcon } = this.props;
        if(typeof renderCloseIcon == 'function') return renderCloseIcon({ wrapperStyle: Styles.closeImgWrapper, imageStyle: Styles.closeImg, onPress: this.onClose });

        return (
            <TouchableWithoutFeedback onPress={this.onClose}>
                <View style={Styles.closeImgWrapper}>
                    <Image 
                        source={require('./close.png')} 
                        style={Styles.closeImg}
                    />
                </View>
            </TouchableWithoutFeedback>
        )
    }

    renderFooterContent() {
        const { items, renderFooter, loop, titleStyle = {}, textStyle = {} } = this.props;
        const { index, timer, focusedIndex } = this.state;

        const item = items[index];

        const titleTranslateY = timer.interpolate({
            inputRange: [0, .05],
            outputRange: [100, 0],
            extrapolate: 'clamp'
        });

        const textTranslateY = timer.interpolate({
            inputRange: [0, .06],
            outputRange: [100, 0],
            extrapolate: 'clamp'
        });

        let opacity = timer.interpolate({
            inputRange: [.9, .95],
            outputRange: [1, 0],
            extrapolate: 'clamp'
        });

        const animation = { titleTranslateY, textTranslateY, opacity };

        if(typeof renderFooter == 'function') return renderFooter({ item, index, focusedIndex, defaultStyle: Styles.footerContentContainer, animation });

        if (!loop) opacity = null;
        return (
            <View style={Styles.footerContentContainer}>
                <View style={{ flex: 1 }}>
                    <View style={{ overflow: 'hidden' }}>
                        <Animated.Text numberOfLines={1} style={[Styles.footerTitle, titleStyle, { opacity, transform: [{ translateY: titleTranslateY }] }]}>
                            {item.title}
                        </Animated.Text>
                    </View>

                    <View style={{ overflow: 'hidden' }}>
                        <Animated.Text numberOfLines={2} style={[Styles.footerText, textStyle, { opacity, transform: [{ translateY: textTranslateY }] }]}>
                            {item.text}
                        </Animated.Text>
                    </View>
                </View>
                <View style={{ height: '100%', justifyContent: 'center' }}>
                    {/* {this.renderIcon()} */}
                    {this.renderCloseIcon()}
                </View>
            </View>
        );
    }

    renderFooter() {
        const { footerStyle } = this.props;
        return (
            <View style={[Styles.footerContainer, footerStyle]}>
                {this.renderProgressBar()}
                {this.renderFooterContent()}
            </View>
        );
    }

    renderContent() {
        const { items, index } = this.props;
        const { layoutWidth, loaded } = this.state;

        if(!loaded) return (
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" animating color="red" />
            </View>
        );

        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    ref={ref => this.slideShow = ref}
                    style={{ flex: 1 }}
                    data={items}
                    extraData={this.state}
                    renderItem={this.renderItem}
                    initialScrollIndex={index}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    getItemLayout={(item, index) => ({ index, length: layoutWidth, offset: layoutWidth * index })}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `slide_item_${index}`}
                />
                {/* {this.renderCloseIcon()} */}
                {this.renderFooter()}
            </View>
        );
    }

    render() {
        return (
            <View style={Styles.root} onLayout={this.onLayout}>
                {this.renderContent()}
            </View>
        );
    }
}