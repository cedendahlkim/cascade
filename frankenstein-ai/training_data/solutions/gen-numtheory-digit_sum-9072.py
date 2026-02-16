# Task: gen-numtheory-digit_sum-9072 | Score: 100% | 2026-02-13T17:11:30.469276

n = int(input())
print(sum(int(d) for d in str(abs(n))))