# Task: gen-ll-reverse_list-5096 | Score: 100% | 2026-02-13T14:10:13.127110

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))