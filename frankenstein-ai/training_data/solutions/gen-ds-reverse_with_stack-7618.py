# Task: gen-ds-reverse_with_stack-7618 | Score: 100% | 2026-02-13T09:13:15.040197

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))