# Task: gen-dict-word_length-5550 | Score: 100% | 2026-02-10T15:42:56.076600

def solve():
    text = input()
    words = text.split()
    word_counts = {}
    for word in words:
        if word in word_counts:
            word_counts[word] += 1
        else:
            word_counts[word] = 1
    
    unique_words = sorted(word_counts.keys())
    
    for word in unique_words:
        print(word, len(word))

solve()