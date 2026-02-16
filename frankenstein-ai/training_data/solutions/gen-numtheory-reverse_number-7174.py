# Task: gen-numtheory-reverse_number-7174 | Score: 100% | 2026-02-13T14:42:35.091339

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))