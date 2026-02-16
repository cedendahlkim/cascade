# Task: gen-ll-reverse_list-9376 | Score: 100% | 2026-02-13T14:19:15.361461

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))