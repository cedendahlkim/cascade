# Task: gen-rec-sum_digits-7965 | Score: 100% | 2026-02-15T13:00:26.992360

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)