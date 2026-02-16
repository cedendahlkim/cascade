# Task: gen-rec-sum_digits-8656 | Score: 100% | 2026-02-13T11:03:59.387406

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)