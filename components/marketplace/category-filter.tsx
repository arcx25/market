"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Category } from "@/lib/types/database"
import { ChevronRight } from "lucide-react"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory?: string
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const parentCategories = categories.filter((cat) => !cat.parent_id)
  const childCategories = categories.filter((cat) => cat.parent_id)

  const handleCategoryClick = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categoryId) {
      params.set("category", categoryId)
    } else {
      params.delete("category")
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant={!selectedCategory ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleCategoryClick(null)}
        >
          All Products
        </Button>

        {parentCategories.map((parent) => {
          const children = childCategories.filter((child) => child.parent_id === parent.id)
          const isParentSelected = selectedCategory === parent.id
          const hasSelectedChild = children.some((child) => child.id === selectedCategory)

          return (
            <div key={parent.id} className="space-y-2">
              <Button
                variant={isParentSelected ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => handleCategoryClick(parent.id)}
              >
                <span>{parent.name}</span>
                {children.length > 0 && <ChevronRight className="h-4 w-4" />}
              </Button>

              {children.length > 0 && (hasSelectedChild || isParentSelected) && (
                <div className="ml-4 space-y-1">
                  {children.map((child) => (
                    <Button
                      key={child.id}
                      variant={selectedCategory === child.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => handleCategoryClick(child.id)}
                    >
                      {child.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
