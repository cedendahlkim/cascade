# Task: gen-numtheory-reverse_number-7699 | Score: 100% | 2026-02-13T19:35:43.979947

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))