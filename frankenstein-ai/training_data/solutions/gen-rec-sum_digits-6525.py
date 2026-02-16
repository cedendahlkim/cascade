# Task: gen-rec-sum_digits-6525 | Score: 100% | 2026-02-15T10:09:52.133089

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)