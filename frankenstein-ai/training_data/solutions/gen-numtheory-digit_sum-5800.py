# Task: gen-numtheory-digit_sum-5800 | Score: 100% | 2026-02-15T09:01:42.282987

n = int(input())
print(sum(int(d) for d in str(abs(n))))