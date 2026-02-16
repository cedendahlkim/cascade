# Task: gen-numtheory-digit_sum-1749 | Score: 100% | 2026-02-13T09:15:55.805126

n = int(input())
print(sum(int(d) for d in str(abs(n))))