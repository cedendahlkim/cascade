# Task: gen-dict-word_length-8515 | Score: 100% | 2026-02-12T20:29:00.619906

def solve():
    text = input()
    words = text.split()
    word_lengths = {}
    for word in words:
        word_lengths[word] = len(word)
    
    sorted_words = sorted(word_lengths.keys())
    
    for word in sorted_words:
        print(f"{word} {word_lengths[word]}")

solve()