# Task: gen-rec-sum_digits-6581 | Score: 100% | 2026-02-15T10:29:15.437453

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)