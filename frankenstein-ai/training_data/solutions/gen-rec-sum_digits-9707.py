# Task: gen-rec-sum_digits-9707 | Score: 100% | 2026-02-15T07:53:20.606599

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)