# Task: gen-rec-sum_digits-8500 | Score: 100% | 2026-02-13T21:48:55.542729

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)