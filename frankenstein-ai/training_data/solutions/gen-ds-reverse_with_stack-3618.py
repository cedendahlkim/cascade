# Task: gen-ds-reverse_with_stack-3618 | Score: 100% | 2026-02-13T18:40:44.759154

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))