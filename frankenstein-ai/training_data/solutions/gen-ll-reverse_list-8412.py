# Task: gen-ll-reverse_list-8412 | Score: 100% | 2026-02-14T12:37:02.859961

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))