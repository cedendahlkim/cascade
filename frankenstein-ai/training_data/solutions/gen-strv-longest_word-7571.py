# Task: gen-strv-longest_word-7571 | Score: 100% | 2026-02-12T19:58:29.968545

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)