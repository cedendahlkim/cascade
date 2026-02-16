# Task: gen-strv-longest_word-3452 | Score: 100% | 2026-02-12T13:48:25.264371

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)