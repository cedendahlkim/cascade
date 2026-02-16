# Task: gen-numtheory-reverse_number-7791 | Score: 100% | 2026-02-13T16:07:06.183641

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))