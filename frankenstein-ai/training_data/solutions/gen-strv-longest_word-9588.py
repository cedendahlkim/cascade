# Task: gen-strv-longest_word-9588 | Score: 100% | 2026-02-12T16:41:50.743984

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)