# Task: gen-numtheory-reverse_number-1185 | Score: 100% | 2026-02-15T08:24:19.202386

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))