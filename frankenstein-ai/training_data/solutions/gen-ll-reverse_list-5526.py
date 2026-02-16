# Task: gen-ll-reverse_list-5526 | Score: 100% | 2026-02-13T12:51:21.468685

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))