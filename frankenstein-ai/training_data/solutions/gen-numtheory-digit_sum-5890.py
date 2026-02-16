# Task: gen-numtheory-digit_sum-5890 | Score: 100% | 2026-02-13T16:07:09.197839

n = int(input())
print(sum(int(d) for d in str(abs(n))))