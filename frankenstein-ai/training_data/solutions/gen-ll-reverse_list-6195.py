# Task: gen-ll-reverse_list-6195 | Score: 100% | 2026-02-13T18:00:57.924096

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))