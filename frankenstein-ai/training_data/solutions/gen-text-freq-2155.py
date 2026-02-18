# Task: gen-text-freq-2155 | Score: 100% | 2026-02-17T20:33:19.734968

def solve():
    text = input()
    words = text.lower().split()
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    
    sorted_counts = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    
    top_3 = sorted_counts[:3]
    
    result = " ".join([f"{word}:{count}" for word, count in top_3])
    print(result)

solve()