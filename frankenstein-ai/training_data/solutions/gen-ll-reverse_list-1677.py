# Task: gen-ll-reverse_list-1677 | Score: 100% | 2026-02-14T12:48:02.721434

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))