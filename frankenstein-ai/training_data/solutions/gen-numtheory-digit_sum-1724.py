# Task: gen-numtheory-digit_sum-1724 | Score: 100% | 2026-02-13T16:47:47.109605

n = int(input())
print(sum(int(d) for d in str(abs(n))))