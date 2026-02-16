# Task: gen-numtheory-reverse_number-4293 | Score: 100% | 2026-02-14T12:14:11.207300

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))