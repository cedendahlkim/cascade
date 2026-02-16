# Task: gen-numtheory-digit_sum-1361 | Score: 100% | 2026-02-15T08:05:58.243644

n = int(input())
print(sum(int(d) for d in str(abs(n))))