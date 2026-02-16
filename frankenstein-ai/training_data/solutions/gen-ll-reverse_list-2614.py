# Task: gen-ll-reverse_list-2614 | Score: 100% | 2026-02-13T18:40:50.731513

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))