# Task: gen-rec-sum_digits-7209 | Score: 100% | 2026-02-15T08:15:02.257210

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)