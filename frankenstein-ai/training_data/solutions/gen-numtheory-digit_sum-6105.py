# Task: gen-numtheory-digit_sum-6105 | Score: 100% | 2026-02-13T09:28:39.386554

n = int(input())
print(sum(int(d) for d in str(abs(n))))