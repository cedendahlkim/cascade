# Task: gen-ll-reverse_list-7162 | Score: 100% | 2026-02-13T14:55:37.368608

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))