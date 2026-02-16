# Task: gen-strv-longest_word-6140 | Score: 100% | 2026-02-12T19:18:10.475547

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)