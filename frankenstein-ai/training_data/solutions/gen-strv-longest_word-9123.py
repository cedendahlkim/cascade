# Task: gen-strv-longest_word-9123 | Score: 100% | 2026-02-12T19:28:40.094534

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)