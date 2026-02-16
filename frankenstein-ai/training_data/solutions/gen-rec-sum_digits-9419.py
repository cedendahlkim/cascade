# Task: gen-rec-sum_digits-9419 | Score: 100% | 2026-02-13T10:02:59.641138

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)